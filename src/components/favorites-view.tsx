"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/favorites-context";
import type { Product } from "@/data/catalog";
import { ProductCard } from "@/components/product-card";

export function FavoritesView({ products }: { products: Product[] }) {
  const { slugs } = useFavorites();
  const favoriteProducts = products.filter((p) => slugs.includes(p.slug));

  if (favoriteProducts.length === 0) {
    return (
      <div className="px-6 py-16 text-center lg:px-10">
        <h1 className="text-2xl font-bold text-foreground">Ainda não tem favoritos</h1>
        <p className="mt-2 text-sm text-muted">Toque no coração em qualquer produto para o guardar aqui.</p>
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
      <h1 className="mb-6 text-2xl font-bold text-foreground">Favoritos</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {favoriteProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
