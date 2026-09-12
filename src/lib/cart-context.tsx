"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/data/catalog";

export type CartLine = { slug: string; qty: number; price: number };
export type AddItemResult = { addedQty: number; limited: boolean };

type CartContextValue = {
  lines: CartLine[];
  addItem: (product: Product, qty?: number) => AddItemResult;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number, maxQty?: number) => boolean;
  clear: () => void;
  count: number;
  total: number;
  getCartQty: (slug: string) => number;
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY_PREFIX = "electrochico:cart";

// customerKey identifica de quem é o carrinho (id do cliente, ou "guest" sem
// sessão) — sem isto, todas as contas na mesma máquina partilhavam o mesmo
// carrinho, porque a chave do localStorage era sempre a mesma. O layout monta
// este provider com key={customerKey}, por isso o componente remonta de
// raiz (e este efeito só corre uma vez) sempre que a conta muda.
export function CartProvider({ children, customerKey }: { children: ReactNode; customerKey?: string | null }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${STORAGE_KEY_PREFIX}:${customerKey ?? "guest"}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // Deliberado: ler no efeito (não num initializer do useState) evita que o
      // primeiro render do cliente já divirja do HTML do servidor (SSR não tem
      // localStorage) — o "hydrated" cobre esse instante em branco.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ponytail: localStorage pode falhar em modo privado — ignora e arranca vazio
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // ver nota acima
    }
  }, [lines, hydrated, storageKey]);

  // Nunca deixa a quantidade no carrinho passar do stock disponível — é aqui
  // que TODAS as formas de alterar quantidade (botão "Adicionar", stepper do
  // carrinho) acabam por passar, por isso o limite só precisa de existir uma vez.
  function addItem(product: Product, qty = 1): AddItemResult {
    let addedQty = 0;
    let limited = false;

    setLines((prev) => {
      const existing = prev.find((l) => l.slug === product.slug);
      const currentQty = existing?.qty ?? 0;
      const maxAddable = Math.max(0, product.stockQuantity - currentQty);
      addedQty = Math.min(qty, maxAddable);
      limited = addedQty < qty;

      if (addedQty <= 0) return prev;
      if (existing) {
        return prev.map((l) =>
          l.slug === product.slug ? { ...l, qty: l.qty + addedQty, price: product.price } : l,
        );
      }
      return [...prev, { slug: product.slug, qty: addedQty, price: product.price }];
    });

    return { addedQty, limited };
  }

  function removeItem(slug: string) {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }

  function setQty(slug: string, qty: number, maxQty?: number): boolean {
    if (qty <= 0) {
      removeItem(slug);
      return false;
    }
    const cappedQty = maxQty !== undefined ? Math.min(qty, maxQty) : qty;
    setLines((prev) => prev.map((l) => (l.slug === slug ? { ...l, qty: cappedQty } : l)));
    return cappedQty < qty;
  }

  function clear() {
    setLines([]);
  }

  function getCartQty(slug: string) {
    return lines.find((l) => l.slug === slug)?.qty ?? 0;
  }

  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0) * l.qty, 0);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, setQty, clear, count, total, getCartQty, hydrated }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
