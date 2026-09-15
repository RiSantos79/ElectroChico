"use client";

import { useRef, useState } from "react";
import { ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/api";
import { updateStaffAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";

const ADMIN_TIER_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export function EditStaffForm({
  id,
  name,
  role: initialRole,
  phone,
  jobTitle,
  isSelf,
}: {
  id: string;
  name: string;
  role: Role;
  phone: string;
  jobTitle: string;
  isSelf: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<Role>(initialRole);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(reauthToken?: string) {
    if (!formRef.current) return;
    setError(null);
    setPending(true);
    const formData = new FormData(formRef.current);
    const result = await updateStaffAction(id, formData, reauthToken);
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ADMIN_TIER_ROLES.includes(role) && role !== initialRole) {
      setShowConfirm(true);
      return;
    }
    void submit();
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input name="name" required defaultValue={name} className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select
            name="role"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as Role)}
            className="input-field"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Telemóvel
          <input name="phone" defaultValue={phone} className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Função/Cargo
          <input name="jobTitle" defaultValue={jobTitle} className="input-field" />
        </label>
        {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 sm:col-span-2"
        >
          {pending ? "A guardar..." : "Guardar"}
        </button>
      </form>
      {isSelf && <p className="mt-2 text-xs text-muted">Não pode alterar a sua própria role.</p>}
      {showConfirm && (
        <ReauthModal
          message="Promover a administrador requer confirmação adicional."
          onCancel={() => setShowConfirm(false)}
          onConfirmed={async (reauthToken) => {
            setShowConfirm(false);
            await submit(reauthToken);
          }}
        />
      )}
    </>
  );
}
