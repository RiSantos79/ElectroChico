"use server";

import { redirect } from "next/navigation";
import { clearCustomerSessionCookie, setCustomerSessionCookie } from "@/lib/customer-session";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

async function issueSession(res: Response) {
  const { accessToken } = await res.json();
  await setCustomerSessionCookie(accessToken);
  redirect("/conta");
}

export async function customerLoginAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) return "Credenciais inválidas.";
  await issueSession(res);
  return null;
}

export async function customerRegisterAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return body?.message ?? "Não foi possível criar a conta.";
  }
  await issueSession(res);
  return null;
}

export async function customerLogoutAction() {
  await clearCustomerSessionCookie();
  redirect("/conta");
}
