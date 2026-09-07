"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { energyClasses, type Product } from "@/data/catalog";

type SortOption = "relevancia" | "preco-asc" | "preco-desc";

export function CatalogView({ title, products }: { title: string; products: Product[] }) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<string[]>([]);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevancia");

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;
    if (selectedBrands.length > 0) list = list.filter((p) => selectedBrands.includes(p.brand));
    if (selectedEnergy.length > 0) list = list.filter((p) => selectedEnergy.includes(p.energyClass));
    if (onlyPromo) list = list.filter((p) => p.badge === "promo");

    if (sort === "preco-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "preco-desc") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, selectedBrands, selectedEnergy, onlyPromo, sort]);

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
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted">{filtered.length} produtos</span>
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
