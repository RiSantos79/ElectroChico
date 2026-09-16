"use client";

import { useRef, useState } from "react";
import { ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/api";
import { createStaffAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";

const ADMIN_TIER_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export function CreateStaffForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<Role>("OPERATOR");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function submit(reauthToken?: string) {
    if (!formRef.current) return;
    setError(null);
    setPending(true);
    const formData = new FormData(formRef.current);
    const result = await createStaffAction(formData, reauthToken);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    formRef.current.reset();
    setRole("OPERATOR");
    setPassword("");
    setConfirmPassword("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setError(null);
    if (ADMIN_TIER_ROLES.includes(role)) {
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
          <input name="name" required className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" name="email" required className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Palavra-passe inicial
          <input
            type="password"
            name="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirmar palavra-passe
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select
            name="role"
            required
            value={role}
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
          Telemóvel (opcional)
          <input name="phone" className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Função/Cargo (opcional)
          <input name="jobTitle" className="input-field" />
        </label>
        {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 sm:col-span-2"
        >
          {pending ? "A criar..." : "Criar funcionário"}
        </button>
      </form>
      {showConfirm && (
        <ReauthModal
          message="Criar uma conta de administrador requer confirmação adicional."
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
