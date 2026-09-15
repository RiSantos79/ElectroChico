"use server";

import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

export type LoginState =
  | { step: "form"; error?: string }
  | { step: "mfa"; mfaToken: string; error?: string }
  | { step: "mfa-setup"; mfaSetupToken: string; secret: string; otpauthUrl: string; qrDataUrl: string; error?: string };

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
    redirect("/admin/produtos");
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
    redirect("/admin/produtos");
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

  const data = await res.json();
  if (data.mfaRequired) return { step: "mfa", mfaToken: data.mfaToken };

  if (data.mfaSetupRequired) {
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

  await setSessionCookie(data.accessToken);
  redirect("/admin/produtos");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
