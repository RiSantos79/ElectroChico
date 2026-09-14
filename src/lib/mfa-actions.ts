"use server";

import QRCode from "qrcode";
import { disableMfa, enableMfa, setupMfa } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

async function requireToken() {
  const token = await getSessionToken();
  if (!token) throw new Error("Sessão expirada — inicie sessão novamente.");
  return token;
}

export type MfaSetupResult =
  | { ok: true; secret: string; otpauthUrl: string; qrDataUrl: string }
  | { ok: false; error: string };

export async function startMfaSetupAction(): Promise<MfaSetupResult> {
  try {
    const token = await requireToken();
    const { secret, otpauthUrl } = await setupMfa(token);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 200 });
    return { ok: true, secret, otpauthUrl, qrDataUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível iniciar a configuração." };
  }
}

export type MfaConfirmResult = { ok: true; recoveryCodes: string[] } | { ok: false; error: string };

export async function confirmMfaSetupAction(code: string): Promise<MfaConfirmResult> {
  try {
    const token = await requireToken();
    const { recoveryCodes } = await enableMfa(code, token);
    return { ok: true, recoveryCodes };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Código inválido." };
  }
}

export async function disableMfaAction(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await disableMfa(password, token);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível desativar." };
  }
}
