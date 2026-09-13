"use client";

import { formatPrice } from "@/lib/format";
import { useIva, toDisplayAmount } from "@/lib/iva-context";

// Substituto direto de formatPrice(amount) para usar dentro de JSX — mostra
// o valor sem IVA quando o visitante escolhe essa opção no cabeçalho.
export function Price({ amount, className }: { amount: number; className?: string }) {
  const { showWithIva } = useIva();
  const text = formatPrice(toDisplayAmount(amount, showWithIva));
  return className ? <span className={className}>{text}</span> : text;
}
