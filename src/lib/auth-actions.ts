"use server";

import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

export type LoginState =
  | { step: "form"; error?: string }
  | { step: "mfa"; mfaToken: string; error?: string }
  | { step: "mfa-setup"; mfaSetupToken: string; secret: string; otpauthUrl: string; qrDataUrl: string; error?: string }
  | { step: "password-change"; passwordChangeToken: string; error?: string };

type LoginResponse = {
  accessToken?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
  mfaSetupRequired?: boolean;
  mfaSetupToken?: string;
  passwordChangeRequired?: boolean;
  passwordChangeToken?: string;
};

// Interpreta a resposta de /auth/login, /auth/mfa/enable-required e
// /auth/change-password-required — todas podem devolver a mesma forma
// (ainda falta um passo, ou já vem o accessToken final). Devolve null
// quando já não falta nada, e quem chamou deve usar data.accessToken.
async function resolveNextStep(data: LoginResponse): Promise<LoginState | null> {
  if (data.passwordChangeRequired && data.passwordChangeToken) {
    return { step: "password-change", passwordChangeToken: data.passwordChangeToken };
  }
  if (data.mfaRequired && data.mfaToken) {
    return { step: "mfa", mfaToken: data.mfaToken };
  }
  if (data.mfaSetupRequired && data.mfaSetupToken) {
    const setupRes = await fetch(`${API_URL}/auth/mfa/setup-required`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaSetupToken: data.mfaSetupToken }),
      cache: "no-store",
    });
    const { secret, otpauthUrl } = await setupRes.json();
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 200 });
    return { step: "mfa-setup", mfaSetupToken: data.mfaSetupToken, secret, otpauthUrl, qrDataUrl };
  }
  return null;
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  if (prevState.step === "mfa") {
    const mfaToken = String(formData.get("mfaToken") ?? prevState.mfaToken);
    const code = String(formData.get("code") ?? "");

    const res = await fetch(`${API_URL}/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaToken, code }),
      cache: "no-store",
    });

    if (!res.ok) return { step: "mfa", mfaToken, error: "Código inválido." };

    const { accessToken } = await res.json();
    await setSessionCookie(accessToken);
    redirect("/admin");
  }

  if (prevState.step === "mfa-setup") {
    const mfaSetupToken = String(formData.get("mfaSetupToken") ?? prevState.mfaSetupToken);
    const code = String(formData.get("code") ?? "");

    const res = await fetch(`${API_URL}/auth/mfa/enable-required`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaSetupToken, code }),
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        step: "mfa-setup",
        mfaSetupToken,
        secret: prevState.secret,
        otpauthUrl: prevState.otpauthUrl,
        qrDataUrl: prevState.qrDataUrl,
        error: "Código inválido.",
      };
    }

    const { accessToken } = await res.json();
    await setSessionCookie(accessToken);
    redirect("/admin");
  }

  if (prevState.step === "password-change") {
    const passwordChangeToken = String(formData.get("passwordChangeToken") ?? prevState.passwordChangeToken);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      return { step: "password-change", passwordChangeToken, error: "A password deve ter pelo menos 8 caracteres." };
    }
    if (newPassword !== confirmPassword) {
      return { step: "password-change", passwordChangeToken, error: "As palavras-passe não coincidem." };
    }

    const res = await fetch(`${API_URL}/auth/change-password-required`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordChangeToken, newPassword }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { step: "password-change", passwordChangeToken, error: body?.message ?? "Não foi possível alterar a password." };
    }

    const data: LoginResponse = await res.json();
    const next = await resolveNextStep(data);
    if (next) return next;

    await setSessionCookie(data.accessToken!);
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { step: "form", error: body?.message ?? "Credenciais inválidas." };
  }

  const data: LoginResponse = await res.json();
  const next = await resolveNextStep(data);
  if (next) return next;

  await setSessionCookie(data.accessToken!);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
