"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction } from "@/lib/account-actions";
import { PasswordField } from "@/components/password-field";

export function AccountProfile({ name, email }: { name?: string | null; email: string }) {
  const [profileError, profileFormAction] = useActionState(updateProfileAction, null);
  const [passwordResult, passwordFormAction] = useActionState(changePasswordAction, null);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Dados pessoais</h2>
        <form action={profileFormAction} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            Nome completo
            <input required name="name" defaultValue={name ?? ""} className="input-field w-full" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input disabled value={email} className="input-field w-full opacity-60" />
          </label>
          {profileError && <p className="text-sm text-danger">{profileError}</p>}
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Guardar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Alterar palavra-passe</h2>
        <form action={passwordFormAction} className="space-y-4">
          <PasswordField name="currentPassword" placeholder="Palavra-passe atual" autoComplete="current-password" />
          <PasswordField name="newPassword" placeholder="Nova palavra-passe" autoComplete="new-password" />
          <PasswordField
            name="confirmPassword"
            placeholder="Confirmar nova palavra-passe"
            autoComplete="new-password"
          />
          {passwordResult && (
            <p className={`text-sm ${passwordResult.ok ? "text-success" : "text-danger"}`}>
              {passwordResult.message}
            </p>
          )}
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Alterar palavra-passe
          </button>
        </form>
      </div>
    </section>
  );
}
