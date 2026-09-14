"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductSearchResult } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`)
        .then((res) => res.json())
        .then((data: ProductSearchResult[]) => {
          setResults(data);
          setOpen(data.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          setResults([]);
          setOpen(false);
        });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/produto/${slug}`);
  }

  function goToFullSearch() {
    setOpen(false);
    router.push(`/catalogo?q=${encodeURIComponent(query)}`);
  }

  return (
    <div ref={containerRef} className="relative mx-auto hidden max-w-xl flex-1 md:block">
      <form
        action="/catalogo"
        onSubmit={(e) => {
          if (activeIndex >= 0 && results[activeIndex]) {
            e.preventDefault();
            goToProduct(results[activeIndex].slug);
          }
        }}
      >
        <label className="relative block">
          <span className="sr-only">Pesquisar produtos</span>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              if (!value.trim()) {
                setResults([]);
                setOpen(false);
              }
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, -1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Pesquisar produtos, marcas e categorias..."
            autoComplete="off"
            className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </label>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
          <ul>
            {results.map((product, i) => (
              <li key={product.id}>
                <button
                  type="button"
                  onMouseDown={() => goToProduct(product.slug)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                    i === activeIndex ? "bg-surface" : "hover:bg-surface"
                  }`}
                >
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniatura da API, não vale a pena otimizar
                    <img src={product.images[0]} alt="" className="size-9 rounded-md object-contain" />
                  ) : (
                    <div className="size-9 shrink-0 rounded-md bg-surface" />
                  )}
                  <span className="flex-1 truncate">
                    <span className="block truncate text-foreground">{product.name}</span>
                    <span className="block text-xs text-muted">{product.brand.name}</span>
                  </span>
                  <span className="shrink-0 font-medium text-foreground">{formatPrice(product.price)}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onMouseDown={goToFullSearch}
            className="block w-full border-t border-border px-4 py-2.5 text-left text-sm font-medium text-accent hover:bg-surface"
          >
            Ver todos os resultados para &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
