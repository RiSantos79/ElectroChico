"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export function ClearCartOnMount() {
  const { clear, hydrated } = useCart();

  // Só limpa depois do carrinho ter carregado do localStorage — limpar antes
  // disso é inútil, porque a leitura seguinte repõe os artigos antigos por cima.
  useEffect(() => {
    if (hydrated) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return null;
}
