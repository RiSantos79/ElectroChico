"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "electrochico:iva";
export const IVA_RATE = 0.23;

type IvaContextValue = {
  showWithIva: boolean;
  setShowWithIva: (value: boolean) => void;
};

const IvaContext = createContext<IvaContextValue | null>(null);

// Os preços na base de dados são sempre COM IVA (prática normal no retalho
// português) — "Sem IVA" só divide para mostrar, nunca altera o que é
// cobrado. Por omissão mostra Com IVA, como já era antes deste botão existir.
export function IvaProvider({ children }: { children: ReactNode }) {
  const [showWithIva, setShowWithIvaState] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Deliberado: ler no efeito evita divergir do HTML do servidor no
      // primeiro render (SSR não tem localStorage) — ver cart-context.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw === "false") setShowWithIvaState(false);
    } catch {
      // ponytail: localStorage pode falhar em modo privado — ignora e fica em Com IVA
    }
  }, []);

  function setShowWithIva(value: boolean) {
    setShowWithIvaState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ver nota acima
    }
  }

  return <IvaContext.Provider value={{ showWithIva, setShowWithIva }}>{children}</IvaContext.Provider>;
}

export function useIva() {
  const ctx = useContext(IvaContext);
  if (!ctx) throw new Error("useIva deve ser usado dentro de IvaProvider");
  return ctx;
}

export function toDisplayAmount(amount: number, showWithIva: boolean): number {
  return showWithIva ? amount : amount / (1 + IVA_RATE);
}
