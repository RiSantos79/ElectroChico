import { afterEach, describe, expect, it, vi } from 'vitest';
import { SenderClient } from './sender.client.js';

// Sem chave de API não há forma de tocar no Sender a sério, por isso o que se
// verifica aqui é o contrato: que URL, que método e que corpo é que saem daqui.
// Quando houver conta, estes testes dizem-nos se o que enviamos bate certo
// com o que a documentação deles descreve.

function mockFetch(responses: { status: number; body: string }[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  let i = 0;
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const res = responses[Math.min(i++, responses.length - 1)];
    return { ok: res.status >= 200 && res.status < 300, status: res.status, text: async () => res.body };
  });
  vi.stubGlobal('fetch', fn);
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('SenderClient', () => {
  it('autentica com Bearer e lê os grupos', async () => {
    const calls = mockFetch([
      { status: 200, body: JSON.stringify({ data: [{ id: 'eZVD4w', title: 'Newsletter', active_subscribers: 12 }] }) },
    ]);

    const result = await new SenderClient('tok_123').listGroups();

    expect(calls[0].url).toBe('https://api.sender.net/v2/groups');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok_123');
    expect(result).toEqual({ ok: true, data: [{ id: 'eZVD4w', title: 'Newsletter', activeSubscribers: 12 }] });
  });

  it('cria o contacto com os campos personalizados no formato do Sender', async () => {
    const calls = mockFetch([{ status: 200, body: '{"data":{"id":"s1"}}' }]);

    await new SenderClient('tok').upsertContact({
      email: 'maria@example.com',
      firstName: 'Maria',
      lastName: 'Silva Costa',
      groupIds: ['eZVD4w'],
      fields: { total_encomendas: 3, valor_gasto: 649.5 },
    });

    expect(calls[0].url).toBe('https://api.sender.net/v2/subscribers');
    expect(calls[0].init.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      email: 'maria@example.com',
      firstname: 'Maria',
      lastname: 'Silva Costa',
      groups: ['eZVD4w'],
      // O Sender identifica campos personalizados por {$nome}.
      fields: { '{$total_encomendas}': 3, '{$valor_gasto}': 649.5 },
    });
  });

  it('recorre a PATCH quando o contacto já existe', async () => {
    // O Sender não tem upsert: o POST falha em duplicados e a atualização
    // tem de ser feita por email.
    const calls = mockFetch([
      { status: 422, body: '{"message":"already exists"}' },
      { status: 200, body: '{"data":{"id":"s1"}}' },
    ]);

    const result = await new SenderClient('tok').upsertContact({ email: 'ja@example.com', firstName: 'Ana' });

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[1].url).toBe('https://api.sender.net/v2/subscribers/ja%40example.com');
    expect(calls[1].init.method).toBe('PATCH');
    // O email identifica o contacto no URL, não se repete no corpo.
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ firstname: 'Ana' });
  });

  it('cancela a subscrição marcando o estado em vez de apagar', async () => {
    const calls = mockFetch([{ status: 200, body: '{}' }]);

    await new SenderClient('tok').unsubscribeContact('sai@example.com');

    expect(calls[0].init.method).toBe('PATCH');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ subscriber_status: 'UNSUBSCRIBED' });
  });

  it('devolve o erro do Sender em vez de lançar', async () => {
    mockFetch([{ status: 401, body: 'Unauthorized' }]);

    const result = await new SenderClient('errada').listGroups();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('401');
  });

  it('não deixa uma falha de rede escapar', async () => {
    // Uma exceção aqui sobe até ao checkout — tem de ser convertida em erro.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );

    const result = await new SenderClient('tok').upsertContact({ email: 'a@b.pt' });

    expect(result).toEqual({ ok: false, error: 'ECONNREFUSED' });
  });
});
