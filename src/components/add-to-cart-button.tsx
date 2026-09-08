"use client";

import { useState, type MouseEvent } from "react";
import type { Product } from "@/data/catalog";
import { useCart } from "@/lib/cart-context";

type Status = "idle" | "added" | "limited";

export function AddToCartButton({ product, className = "" }: { product: Product; className?: string }) {
  const { addItem, getCartQty } = useCart();
  const [status, setStatus] = useState<Status>("idle");
  const remaining = Math.max(0, product.stockQuantity - getCartQty(product.slug));
  const outOfStock = remaining <= 0;

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;

    const { limited } = addItem(product);
    setStatus(limited ? "limited" : "added");
    setTimeout(() => setStatus("idle"), limited ? 2200 : 1200);
  }

  const label =
    status === "added"
      ? "Adicionado ✓"
      : status === "limited"
        ? `Só há ${product.stockQuantity} em stock`
        : outOfStock
          ? "Esgotado"
          : "Adicionar";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        status === "added"
          ? "bg-success text-white"
          : status === "limited"
            ? "bg-danger text-white"
            : "bg-accent text-accent-foreground hover:opacity-90"
      } ${className}`}
    >
      {status === "idle" && !outOfStock && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5">
          <path
            d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="20" r="1.3" />
          <circle cx="17.5" cy="20" r="1.3" />
        </svg>
      )}
      {label}
    </button>
  );
}
