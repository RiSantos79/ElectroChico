"use client";

import type { Product } from "@/data/catalog";
import { useCart } from "@/lib/cart-context";
import { StockBar } from "@/components/stock-bar";

// Mostra o que ainda pode ser adicionado ao carrinho (stock - já no carrinho),
// não o stock total na base de dados — é isso que importa para quem está a comprar.
export function ProductStockBar({
  product,
  compact = false,
  className = "",
}: {
  product: Product;
  compact?: boolean;
  className?: string;
}) {
  const { getCartQty } = useCart();
  const remaining = Math.max(0, product.stockQuantity - getCartQty(product.slug));

  return <StockBar quantity={remaining} compact={compact} className={className} />;
}
