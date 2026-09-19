"use client";

import { useEffect, useState } from "react";
import { CreateStaffForm } from "./create-staff-form";

export function CreateStaffModal() {
  const [open, setOpen] = useState(false);

  // Escape fecha, como em qualquer janela modal. O ouvinte só existe enquanto
  // a janela está aberta para não interferir com o resto da página.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Novo funcionário
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          // Fechar ao clicar fora, mas só quando o clique é mesmo no fundo —
          // sem isto, arrastar o rato de dentro para fora fechava o formulário
          // já preenchido.
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-funcionario-titulo"
            className="my-auto w-full max-w-2xl rounded-xl border border-border bg-surface-raised p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="novo-funcionario-titulo" className="text-lg font-semibold text-foreground">
                Novo funcionário
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <CreateStaffForm onCreated={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
