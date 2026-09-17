"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "electrochico:comparison";
export const MAX_COMPARE = 4;

type ComparisonContextValue = {
  slugs: string[];
  toggle: (slug: string) => void;
  isComparing: (slug: string) => boolean;
  clear: () => void;
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

// Mesma lógica do FavoritesProvider (ver favorites-context.tsx), mas sem
// segmentar por cliente — comparar produtos é uma ferramenta de pesquisa
// pontual, não faz sentido guardar por conta.
export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSlugs(JSON.parse(raw));
    } catch {
      // ponytail: localStorage pode falhar em modo privado — ignora e arranca vazio
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      // ver nota acima
    }
  }, [slugs, hydrated]);

  function toggle(slug: string) {
    setSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, slug];
    });
  }

  function clear() {
    setSlugs([]);
  }

  return (
    <ComparisonContext.Provider value={{ slugs, toggle, isComparing: (slug) => slugs.includes(slug), clear }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison deve ser usado dentro de ComparisonProvider");
  return ctx;
}
