"use client";

import { useState, useTransition } from "react";
import { verifyReauthAction } from "@/lib/admin-actions";

export function ReauthModal({
  message,
  onCancel,
  onConfirmed,
}: {
  message?: string;
  onCancel: () => void;
  onConfirmed: (reauthToken: string) => void | Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await verifyReauthAction(password, code || undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await onConfirmed(result.reauthToken);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6">
        <h3 className="mb-1 text-base font-semibold text-foreground">Confirmar ação</h3>
        <p className="mb-4 text-sm text-muted">
          {message ?? "Esta ação requer confirmação da sua palavra-passe."}
        </p>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="A sua palavra-passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="input-field w-full"
          />
          <input
            type="text"
            placeholder="Código MFA (se ativo)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-field w-full"
          />
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-foreground">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending || !password}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "A confirmar..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
