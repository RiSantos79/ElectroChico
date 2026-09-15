"use client";

import { deleteProductAction } from "@/lib/admin-actions";
import { CriticalActionButton } from "./critical-action-button";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <CriticalActionButton
      label="Apagar"
      pendingLabel="A apagar..."
      danger
      message={`Apagar "${name}" requer confirmação da sua palavra-passe.`}
      onConfirmed={async (reauthToken) => {
        const result = await deleteProductAction(id, reauthToken);
        if (!result.ok) alert(result.error);
      }}
    />
  );
}
