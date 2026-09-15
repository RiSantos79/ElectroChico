"use client";

import { useRef, useState } from "react";
import { ACTIONS, ACTION_LABELS, MODULES, MODULE_LABELS, type PermissionMatrix } from "@/lib/api";
import { updateStaffPermissionsAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";

export function PermissionsForm({ id, effectivePermissions }: { id: string; effectivePermissions: PermissionMatrix }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowConfirm(true);
  }

  async function submit(reauthToken: string) {
    if (!formRef.current) return;
    setError(null);
    setPending(true);
    const formData = new FormData(formRef.current);
    const result = await updateStaffPermissionsAction(id, formData, reauthToken);
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="px-2 py-2 font-medium">Módulo</th>
                {ACTIONS.map((action) => (
                  <th key={action} className="px-2 py-2 text-center font-medium">
                    {ACTION_LABELS[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MODULES.map((moduleKey) => (
                <tr key={moduleKey}>
                  <td className="px-2 py-2 font-medium text-foreground">{MODULE_LABELS[moduleKey]}</td>
                  {ACTIONS.map((action) => (
                    <td key={action} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        name={`perm_${moduleKey}_${action}`}
                        defaultChecked={effectivePermissions[moduleKey][action]}
                        className="size-4"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "A guardar..." : "Guardar permissões"}
        </button>
      </form>
      {showConfirm && (
        <ReauthModal
          message="Alterar permissões requer confirmação adicional."
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
