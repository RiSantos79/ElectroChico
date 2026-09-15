"use client";

export function ConfirmDialog({
  message,
  confirmLabel = "Confirmar",
  danger,
  pending,
  onCancel,
  onConfirm,
}: {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6">
        <h3 className="mb-2 text-base font-semibold text-foreground">Confirmar ação</h3>
        <p className="text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-sm font-medium text-muted hover:text-foreground">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={
              danger
                ? "rounded-full bg-danger px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                : "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            }
          >
            {pending ? "A processar..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
