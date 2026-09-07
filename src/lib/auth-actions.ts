"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

export async function loginAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) return "Credenciais inválidas.";

  const { accessToken } = await res.json();
  await setSessionCookie(accessToken);
  redirect("/admin/produtos");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
