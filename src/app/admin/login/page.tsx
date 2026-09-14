"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/auth-actions";

const initialState: LoginState = { step: "form" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-foreground">Backoffice</h1>
      <p className="mt-1 text-sm text-muted">Acesso restrito à equipa ElectroChico.</p>

      {state.step === "mfa" ? (
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="mfaToken" value={state.mfaToken} />
          <p className="text-sm text-muted">
            Introduza o código de 6 dígitos da app de autenticação, ou um código de recuperação.
          </p>
          <input
            name="code"
            required
            autoFocus
            placeholder="123456 ou XXXX-XXXX"
            className="input-field w-full"
          />
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "A verificar..." : "Verificar"}
          </button>
        </form>
      ) : (
        <form action={formAction} className="mt-6 space-y-4">
          <input name="email" type="email" required placeholder="Email" className="input-field w-full" />
          <input name="password" type="password" required placeholder="Palavra-passe" className="input-field w-full" />
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "A entrar..." : "Entrar"}
          </button>
        </form>
      )}
    </div>
  );
}
