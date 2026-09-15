"use client";

import { useState } from "react";
import { ReauthModal } from "./reauth-modal";

export function CriticalActionButton({
  label,
  pendingLabel,
  message,
  danger,
  onConfirmed,
}: {
  label: string;
  pendingLabel?: string;
  message?: string;
  danger?: boolean;
  onConfirmed: (reauthToken: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className={
          danger
            ? "text-sm font-medium text-danger hover:underline disabled:opacity-50"
            : "text-sm font-medium text-accent hover:underline disabled:opacity-50"
        }
      >
        {busy ? (pendingLabel ?? "A processar...") : label}
      </button>
      {open && (
        <ReauthModal
          message={message}
          onCancel={() => setOpen(false)}
          onConfirmed={async (token) => {
            setOpen(false);
            setBusy(true);
            try {
              await onConfirmed(token);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </>
  );
}
