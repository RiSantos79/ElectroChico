"use client";

import Link from "next/link";
import type { Product } from "@/data/catalog";
import { useComparison } from "@/lib/comparison-context";
import { ProductMedia } from "@/components/product-media";
import { Price } from "@/components/price";

function specValue(product: Product, label: string) {
  return product.specs.find((s) => s.label === label)?.value ?? "—";
}

export function ComparisonView({ products }: { products: Product[] }) {
  const { slugs, toggle, clear } = useComparison();
  const compared = slugs.map((slug) => products.find((p) => p.slug === slug)).filter((p): p is Product => !!p);
  const specLabels = [...new Set(compared.flatMap((p) => p.specs.map((s) => s.label)))];

  if (compared.length === 0) {
    return (
      <div className="px-6 py-16 text-center lg:px-10">
        <h1 className="text-2xl font-bold text-foreground">Ainda não escolheu produtos para comparar</h1>
        <p className="mt-2 text-sm text-muted">
          Use o botão de comparação em qualquer produto do catálogo para o adicionar aqui.
        </p>
        <Link
          href="/catalogo"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Comparar produtos ({compared.length})</h1>
        <button type="button" onClick={clear} className="text-sm font-medium text-danger hover:underline">
          Limpar comparação
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-40 px-3 py-3 text-left align-bottom font-medium text-muted"></th>
              {compared.map((p) => (
                <th key={p.slug} className="min-w-48 px-3 py-3 align-bottom text-left">
                  <Link href={`/produto/${p.slug}`} className="block">
                    <ProductMedia color={p.color} name={p.name} image={p.images[0]} className="aspect-square w-full" />
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground hover:text-accent">{p.name}</p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(p.slug)}
                    className="mt-1 text-xs font-medium text-danger hover:underline"
                  >
                    Remover
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-3 py-3 font-medium text-foreground">Preço</td>
              {compared.map((p) => (
                <td key={p.slug} className="px-3 py-3 font-semibold text-foreground">
                  <Price amount={p.price} />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-3 font-medium text-foreground">Marca</td>
              {compared.map((p) => (
                <td key={p.slug} className="px-3 py-3 text-muted">
                  {p.brand}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-3 font-medium text-foreground">Classe energética</td>
              {compared.map((p) => (
                <td key={p.slug} className="px-3 py-3 text-muted">
                  {p.energyClass}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-3 font-medium text-foreground">Avaliação</td>
              {compared.map((p) => (
                <td key={p.slug} className="px-3 py-3 text-muted">
                  {p.rating.toFixed(1)} ({p.reviews})
                </td>
              ))}
            </tr>
            {specLabels.map((label) => (
              <tr key={label}>
                <td className="px-3 py-3 font-medium text-foreground">{label}</td>
                {compared.map((p) => (
                  <td key={p.slug} className="px-3 py-3 text-muted">
                    {specValue(p, label)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
