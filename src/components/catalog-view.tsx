"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { energyClasses, type Product } from "@/data/catalog";
import { matchesSearch } from "@/lib/search";
import { PriceRangeSlider } from "@/components/price-range-slider";

type SortOption = "relevancia" | "preco-asc" | "preco-desc";

export function CatalogView({
  title,
  products,
  initialQuery = "",
}: {
  title: string;
  products: Product[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<string[]>([]);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevancia");

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  );
  // Tudo exceto o preço — é a partir desta lista que a barra de preço
  // calcula o mínimo/máximo, para refletir só os resultados da pesquisa
  // e dos outros filtros ativos, não o catálogo inteiro.
  const preRangeFiltered = useMemo(() => {
    let list = products;
    if (query.trim()) list = list.filter((p) => matchesSearch(p, query));
    if (selectedBrands.length > 0) list = list.filter((p) => selectedBrands.includes(p.brand));
    if (selectedEnergy.length > 0) list = list.filter((p) => selectedEnergy.includes(p.energyClass));
    if (onlyPromo) list = list.filter((p) => p.badge === "promo");
    if (onlyAvailable) list = list.filter((p) => p.stockQuantity > 0);
    return list;
  }, [products, query, selectedBrands, selectedEnergy, onlyPromo, onlyAvailable]);

  const priceBounds = useMemo(() => {
    if (preRangeFiltered.length === 0) return { min: 0, max: 0 };
    const prices = preRangeFiltered.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [preRangeFiltered]);

  const [priceRange, setPriceRange] = useState<[number, number]>(() => [priceBounds.min, priceBounds.max]);

  // Sempre que a pesquisa/outros filtros mudam o intervalo disponível,
  // a barra reajusta-se automaticamente ao novo mínimo/máximo.
  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds.min, priceBounds.max]);

  const filtered = useMemo(() => {
    let list = preRangeFiltered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sort === "preco-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "preco-desc") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [preRangeFiltered, priceRange, sort]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{title}</h1>
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Marca</h2>
            <div className="space-y-2">
              {availableBrands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggle(selectedBrands, setSelectedBrands, brand)}
                    className="size-4 accent-accent"
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Preço</h2>
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceRange}
              onChange={setPriceRange}
            />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Classe energética</h2>
            <div className="flex flex-wrap gap-2">
              {energyClasses.map((energyClass) => (
                <button
                  key={energyClass}
                  type="button"
                  onClick={() => toggle(selectedEnergy, setSelectedEnergy, energyClass)}
                  className={`size-8 rounded-md border text-sm font-medium ${
                    selectedEnergy.includes(energyClass)
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-muted hover:border-accent"
                  }`}
                >
                  {energyClass}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={onlyPromo}
              onChange={(e) => setOnlyPromo(e.target.checked)}
              className="size-4 accent-accent"
            />
            Só promoções
          </label>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="size-4 accent-accent"
            />
            Só disponíveis
          </label>
        </aside>

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar nesta lista..."
              className="input-field w-full sm:max-w-xs"
            />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="whitespace-nowrap text-sm text-muted">{filtered.length} produtos</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="relevancia">Relevância</option>
                <option value="preco-asc">Preço: mais baixo</option>
                <option value="preco-desc">Preço: mais alto</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
              Sem produtos para os filtros selecionados.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
