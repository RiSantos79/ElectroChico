"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/data/catalog";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Price } from "@/components/price";

// Aparece quando o botão principal de compra sai do ecrã ao fazer scroll —
// a sentinela fica onde o botão original está; quando deixa de estar visível
// (rootMargin negativo compensa a altura do header fixo), mostra-se a barra.
export function StickyBuyBar({ product }: { product: Product }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: "-96px 0px 0px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} />
      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised/95 px-4 py-3 shadow-lg backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-6xl items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-sm font-semibold text-foreground">
                <Price amount={product.price} />
              </p>
            </div>
            <AddToCartButton product={product} className="shrink-0 px-6 py-2.5 text-sm" />
          </div>
        </div>
      )}
    </>
  );
}
