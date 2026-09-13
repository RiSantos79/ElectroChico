"use client";

import { useIva } from "@/lib/iva-context";

export function IvaToggle() {
  const { showWithIva, setShowWithIva } = useIva();

  return (
    <button
      type="button"
      onClick={() => setShowWithIva(!showWithIva)}
      aria-pressed={showWithIva}
      aria-label="Alternar entre preços com e sem IVA"
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs"
    >
      <span className={showWithIva ? "text-muted" : "font-semibold text-foreground"}>Sem IVA</span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-foreground/80">
        <span
          className={`inline-block size-4 rounded-full bg-background transition-transform ${
            showWithIva ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className={showWithIva ? "font-semibold text-foreground" : "text-muted"}>Com IVA</span>
    </button>
  );
}
