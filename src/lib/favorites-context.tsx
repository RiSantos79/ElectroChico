"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type FavoritesContextValue = {
  slugs: string[];
  toggle: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY_PREFIX = "electrochico:favorites";

// Mesma lógica do CartProvider: sem segmentar por cliente, todas as contas
// na mesma máquina partilhavam os mesmos favoritos. O layout monta este
// provider com key={customerKey}, por isso remonta de raiz ao trocar de conta.
export function FavoritesProvider({
  children,
  customerKey,
}: {
  children: ReactNode;
  customerKey?: string | null;
}) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${STORAGE_KEY_PREFIX}:${customerKey ?? "guest"}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // Deliberado: ver nota equivalente em cart-context.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSlugs(JSON.parse(raw));
    } catch {
      // ponytail: localStorage pode falhar em modo privado — ignora e arranca vazio
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(slugs));
    } catch {
      // ver nota acima
    }
  }, [slugs, hydrated, storageKey]);

  function toggle(slug: string) {
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <FavoritesContext.Provider value={{ slugs, toggle, isFavorite: (slug) => slugs.includes(slug) }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
