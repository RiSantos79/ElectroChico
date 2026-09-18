import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

// As garantias testadas aqui são de segurança, não de funcionalidade: sem
// elas o fluxo "funciona" na mesma e deixa a loja exposta.

type Row = { userId: string; tokenHash: string; expiresAt: Date; user: { email: string } };

function buildService(user: { id: string; email: string; status: string } | null) {
  let stored: Row | null = null;
  const sent: { to: string; subject: string; html: string }[] = [];
  const updates: Record<string, unknown>[] = [];
  const revoked: unknown[] = [];

  const prisma = {
    user: {
      findUnique: vi.fn(async () => user),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return {};
      }),
    },
    passwordResetToken: {
      deleteMany: vi.fn(async () => {
        stored = null;
        return { count: 1 };
      }),
      create: vi.fn(async ({ data }: { data: Row }) => {
        stored = { ...data, user: { email: user?.email ?? '' } };
        return stored;
      }),
      findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) =>
        stored && stored.tokenHash === where.tokenHash ? stored : null,
      ),
    },
    session: {
      updateMany: vi.fn(async (args: unknown) => {
        revoked.push(args);
        return { count: 1 };
      }),
    },
    // As operações da transação já correram ao serem construídas nos mocks.
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  const email = { send: vi.fn(async (params: { to: string; subject: string; html: string }) => {
    sent.push(params);
    return { sent: true as const };
  }) };
  const audit = { log: vi.fn(async () => undefined) };

  const service = new AuthService(
    prisma as never,
    { signAsync: vi.fn() } as never,
    audit as never,
    email as never,
  );

  return { service, prisma, sent, updates, revoked, getStored: () => stored };
}

const activeUser = { id: 'u1', email: 'maria@example.com', status: 'ACTIVE' };

beforeEach(() => {
  process.env.WEB_ORIGIN = 'https://loja.example.com';
});

describe('requestPasswordReset', () => {
  it('não revela se a conta existe', async () => {
    const existe = buildService(activeUser);
    const naoExiste = buildService(null);

    const r1 = await existe.service.requestPasswordReset('maria@example.com');
    const r2 = await naoExiste.service.requestPasswordReset('ninguem@example.com');

    // Mesma resposta nos dois casos — é isto que impede o formulário de servir
    // para descobrir que emails estão registados.
    expect(r1).toEqual(r2);
    expect(naoExiste.sent).toHaveLength(0);
  });

  it('não envia nada para contas suspensas', async () => {
    const { service, sent } = buildService({ ...activeUser, status: 'SUSPENDED' });
    await service.requestPasswordReset('maria@example.com');
    expect(sent).toHaveLength(0);
  });

  it('guarda o token cifrado, nunca em claro, e põe-no no link', async () => {
    const { service, sent, getStored } = buildService(activeUser);

    await service.requestPasswordReset('maria@example.com');

    const url = /href="([^"]+recuperar-password[^"]+)"/.exec(sent[0].html)?.[1] ?? '';
    const token = new URL(url).searchParams.get('token') ?? '';

    expect(token.length).toBeGreaterThan(30);
    expect(url).toContain('https://loja.example.com/recuperar-password');
    // O que fica na base de dados não pode servir para forjar um link.
    expect(getStored()?.tokenHash).not.toBe(token);
    expect(getStored()?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('invalida pedidos anteriores', async () => {
    const { service, prisma } = buildService(activeUser);
    await service.requestPasswordReset('maria@example.com');
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  async function comTokenValido() {
    const ctx = buildService(activeUser);
    await ctx.service.requestPasswordReset('maria@example.com');
    const url = /href="([^"]+)"/.exec(ctx.sent[0].html)?.[1] ?? '';
    return { ...ctx, token: new URL(url).searchParams.get('token') ?? '' };
  }

  it('recusa um token inventado', async () => {
    const { service } = await comTokenValido();
    await expect(service.resetPassword('token-falso', 'novaPass123')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recusa um token expirado', async () => {
    const ctx = await comTokenValido();
    const stored = ctx.getStored();
    if (stored) stored.expiresAt = new Date(Date.now() - 1000);

    await expect(ctx.service.resetPassword(ctx.token, 'novaPass123')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('só pode ser usado uma vez', async () => {
    const ctx = await comTokenValido();

    await ctx.service.resetPassword(ctx.token, 'novaPass123');
    // O mesmo link chegado por email não pode voltar a servir.
    await expect(ctx.service.resetPassword(ctx.token, 'outraPass123')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('termina as sessões abertas e desbloqueia a conta', async () => {
    const ctx = await comTokenValido();

    await ctx.service.resetPassword(ctx.token, 'novaPass123');

    // Se a password foi recuperada, pode ter havido acesso indevido.
    expect(ctx.revoked).toHaveLength(1);
    const data = ctx.updates[0];
    expect(data.lockedUntil).toBeNull();
    expect(data.failedLoginAttempts).toBe(0);
    expect(data.mustChangePassword).toBe(false);
    // A password guardada é um hash argon2, não o texto escrito pelo cliente.
    expect(String(data.passwordHash)).toMatch(/^\$argon2/);
    expect(String(data.passwordHash)).not.toContain('novaPass123');
  });
});
