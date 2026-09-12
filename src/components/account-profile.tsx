"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/account-actions";

export function AccountProfile({ name, email }: { name?: string | null; email: string }) {
  const [profileError, profileFormAction] = useActionState(updateProfileAction, null);

  return (
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
  );
}
