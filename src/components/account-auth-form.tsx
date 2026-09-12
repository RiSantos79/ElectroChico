"use client";

import { useActionState, useState, type FormEvent } from "react";
import { customerLoginAction, customerRegisterAction } from "@/lib/customer-auth-actions";
import { PasswordField } from "@/components/password-field";

export function AccountAuthForm() {
  const [tab, setTab] = useState<"entrar" | "criar">("entrar");
  const [matchError, setMatchError] = useState<string | null>(null);
  const [loginError, loginFormAction] = useActionState(customerLoginAction, null);
  const [registerError, registerFormAction] = useActionState(customerRegisterAction, null);

  const error = matchError ?? (tab === "entrar" ? loginError : registerError);

  function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      e.preventDefault();
      setMatchError("As palavras-passe não coincidem.");
    } else {
      setMatchError(null);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12 lg:px-10">
      <div className="mb-6 flex rounded-full border border-border p-1">
        {(["entrar", "criar"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setMatchError(null);
            }}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              tab === t ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {t === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {tab === "entrar" ? (
        <form action={loginFormAction} className="space-y-4">
          <input required type="email" name="email" placeholder="Email" className="input-field w-full" />
          <PasswordField name="password" placeholder="Palavra-passe" autoComplete="current-password" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      ) : (
        <form action={registerFormAction} onSubmit={handleRegisterSubmit} className="space-y-4">
          <input required name="name" placeholder="Nome completo" className="input-field w-full" />
          <input required type="email" name="email" placeholder="Email" className="input-field w-full" />
          <PasswordField name="password" placeholder="Palavra-passe" autoComplete="new-password" />
          <PasswordField name="confirmPassword" placeholder="Confirmar palavra-passe" autoComplete="new-password" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Criar conta
          </button>
        </form>
      )}
    </div>
  );
}
