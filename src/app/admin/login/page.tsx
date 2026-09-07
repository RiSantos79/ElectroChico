"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";

export default function AdminLoginPage() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-foreground">Backoffice</h1>
      <p className="mt-1 text-sm text-muted">Acesso restrito à equipa ElectroChico.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <input name="email" type="email" required placeholder="Email" className="input-field w-full" />
        <input name="password" type="password" required placeholder="Palavra-passe" className="input-field w-full" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "A entrar..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
