"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACTIONS, ACTION_LABELS, MODULES, MODULE_LABELS, ROLE_LABELS, type PermissionMatrix, type Role } from "@/lib/api";
import { resetStaffPermissionsAction, updateStaffPermissionsAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";
import { SuccessDialog } from "./success-dialog";

type PendingAction = "save" | "reset";

export function PermissionsForm({
  id,
  role,
  effectivePermissions,
  hasOverrides,
}: {
  id: string;
  role: Role;
  effectivePermissions: PermissionMatrix;
  hasOverrides: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPendingAction("save");
  }

  async function confirmed(reauthToken: string) {
    if (!pendingAction) return;
    setBusy(true);
    const result =
      pendingAction === "save" && formRef.current
        ? await updateStaffPermissionsAction(id, new FormData(formRef.current), reauthToken)
        : await resetStaffPermissionsAction(id, reauthToken);
    setBusy(false);
    setPendingAction(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccessMessage(pendingAction === "save" ? "Permissões guardadas com sucesso." : "Permissões repostas para a role.");
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Permissões</h2>
        <button
          type="button"
          onClick={() => setPendingAction("reset")}
          className="text-sm font-medium text-accent hover:underline"
        >
          Repor permissões da role
        </button>
      </div>
      {!hasOverrides && (
        <p className="mb-4 text-xs text-muted">
          A usar as permissões por omissão de &ldquo;{ROLE_LABELS[role]}&rdquo;. Marcar/desmarcar qualquer caixa
          abaixo cria uma personalização só para este funcionário.
        </p>
      )}
      {hasOverrides && (
        <p className="mb-4 text-xs text-amber-500">
          Este funcionário tem permissões personalizadas, diferentes da role &ldquo;{ROLE_LABELS[role]}&rdquo;.
        </p>
      )}

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
          disabled={busy}
          className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "A guardar..." : "Guardar permissões"}
        </button>
      </form>

      {pendingAction && (
        <ReauthModal
          message="Alterar permissões requer confirmação adicional."
          onCancel={() => setPendingAction(null)}
          onConfirmed={confirmed}
        />
      )}

      {successMessage && (
        <SuccessDialog message={successMessage} onClose={() => router.push("/admin/utilizadores")} />
      )}
    </>
  );
}
