"use server";

import { requestPasswordReset, resetPassword } from "@/lib/api";

// Devolve sempre a mesma mensagem, exista ou não a conta: dizer "email não
// encontrado" transformaria este formulário numa lista de clientes.
export async function requestPasswordResetAction(_prev: string | null, formData: FormData): Promise<string> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return "Indique o seu email.";

  try {
    await requestPasswordReset(email);
  } catch {
    // Mesmo perante uma falha da API, não se revela nada sobre a conta.
  }
  return "ok";
}

export async function resetPasswordAction(_prev: string | null, formData: FormData): Promise<string> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) return "A palavra-passe tem de ter pelo menos 8 caracteres.";
  if (newPassword !== confirm) return "As palavras-passe não coincidem.";

  try {
    await resetPassword(token, newPassword);
    return "ok";
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível definir a nova palavra-passe.";
  }
}
