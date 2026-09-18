"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/components/password-field";
import { requestPasswordResetAction, resetPasswordAction } from "@/lib/password-reset-actions";

// Com token no endereço, o formulário define a nova palavra-passe; sem token,
// pede o email. São dois passos do mesmo fluxo, por isso partilham a página.
export function PasswordResetForm({ token }: { token?: string }) {
  return token ? <SetNewPassword token={token} /> : <RequestLink />;
}

function RequestLink() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);

  if (state === "ok") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Se existir uma conta com esse email, enviámos um link para definir uma nova palavra-passe. O link é
          válido durante uma hora.
        </p>
        <p className="text-sm text-muted">
          Não recebeu? Verifique a pasta de spam antes de pedir outro.
        </p>
        <Link href="/conta" className="text-sm font-medium text-accent hover:underline">
          ← Voltar a entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted">
        Indique o email da sua conta e enviamos-lhe um link para definir uma nova palavra-passe.
      </p>
      <input
        required
        type="email"
        name="email"
        placeholder="Email"
        autoComplete="email"
        className="input-field w-full"
      />
      {state && state !== "ok" && <p className="text-sm text-danger">{state}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "A enviar..." : "Enviar link de recuperação"}
      </button>
      <Link href="/conta" className="block text-center text-sm font-medium text-accent hover:underline">
        ← Voltar a entrar
      </Link>
    </form>
  );
}

function SetNewPassword({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);

  if (state === "ok") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Palavra-passe alterada. Por segurança, todas as sessões abertas foram terminadas.
        </p>
        <Link
          href="/conta"
          className="block rounded-full bg-accent px-6 py-3 text-center text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Entrar com a nova palavra-passe
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted">Escolha uma palavra-passe com pelo menos 8 caracteres.</p>
      <PasswordField name="newPassword" placeholder="Nova palavra-passe" autoComplete="new-password" />
      <PasswordField name="confirmPassword" placeholder="Confirmar palavra-passe" autoComplete="new-password" />
      {state && state !== "ok" && <p className="text-sm text-danger">{state}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "A guardar..." : "Definir nova palavra-passe"}
      </button>
    </form>
  );
}
