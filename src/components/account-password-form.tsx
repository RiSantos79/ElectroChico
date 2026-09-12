"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/account-actions";
import { PasswordField } from "@/components/password-field";

export function AccountPasswordForm() {
  const [result, formAction] = useActionState(changePasswordAction, null);

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Alterar palavra-passe</h2>
      <form action={formAction} className="space-y-4">
        <PasswordField name="currentPassword" placeholder="Palavra-passe atual" autoComplete="current-password" />
        <PasswordField name="newPassword" placeholder="Nova palavra-passe" autoComplete="new-password" />
        <PasswordField name="confirmPassword" placeholder="Confirmar nova palavra-passe" autoComplete="new-password" />
        {result && (
          <p className={`text-sm ${result.ok ? "text-success" : "text-danger"}`}>{result.message}</p>
        )}
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Alterar palavra-passe
        </button>
      </form>
    </div>
  );
}
