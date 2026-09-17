"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

const INSTALLMENT_OPTIONS = [3, 6, 10, 12, 24];

// Simulação sem juros (preço a dividir), só para dar uma ideia do valor
// mensal — não representa uma proposta de crédito real.
// ponytail: sem integração com financeira; se um dia houver parceria de
// crédito ao consumo, este componente passa a chamar essa API em vez de dividir.
export function InstallmentSimulator({ price }: { price: number }) {
  const [months, setMonths] = useState(12);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>ou em</span>
      <select
        value={months}
        onChange={(e) => setMonths(Number(e.target.value))}
        aria-label="Número de prestações"
        className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground"
      >
        {INSTALLMENT_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}x
          </option>
        ))}
      </select>
      <span>
        de <span className="font-semibold text-foreground">{formatPrice(price / months)}</span> sem juros
      </span>
    </div>
  );
}
