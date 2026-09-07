"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/favorites-context";

export function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggle, isFavorite } = useFavorites();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === "out-of-stock";
  const favorite = isFavorite(product.slug);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    addItem(product);
    router.push("/carrinho");
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={outOfStock}
        onClick={handleAdd}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? "Adicionado ✓" : "Adicionar ao carrinho"}
      </button>
      <button
        type="button"
        disabled={outOfStock}
        onClick={handleBuyNow}
        className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
      >
        Comprar agora
      </button>
      <button
        type="button"
        onClick={() => toggle(product.slug)}
        aria-pressed={favorite}
        className="flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium hover:bg-surface"
      >
        <span className={favorite ? "text-accent" : ""}>{favorite ? "♥" : "♡"}</span> Favoritos
      </button>
    </div>
  );
}
