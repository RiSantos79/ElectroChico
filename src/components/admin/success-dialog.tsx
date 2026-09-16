"use client";

export function SuccessDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6">
        <h3 className="mb-2 text-base font-semibold text-foreground">Sucesso</h3>
        <p className="text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
