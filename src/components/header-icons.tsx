"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/favorites-context";
import { formatPrice } from "@/lib/format";
import { AccountMenu } from "@/components/account-menu";

export function HeaderIcons({ customerName }: { customerName?: string | null }) {
  const { count, total } = useCart();
  const { slugs } = useFavorites();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/favoritos"
        aria-label="Favoritos"
        className="relative flex size-9 items-center justify-center rounded-full border border-border hover:bg-surface"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5">
          <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.4 5 6 5c2 0 3.5 1.1 4.5 2.6L12 9l1.5-1.4C14.5 6.1 16 5 18 5c3.6 0 5.5 3.4 4 6.9-2.5 4.5-10 9.1-10 9.1Z" />
        </svg>
        {slugs.length > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
            {slugs.length}
          </span>
        )}
      </Link>
      <AccountMenu customerName={customerName} />
      <Link
        href="/carrinho"
        aria-label="Carrinho"
        className="flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5">
          <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9.5" cy="20" r="1.3" />
          <circle cx="17.5" cy="20" r="1.3" />
        </svg>
        <span>
          {count} {count === 1 ? "artigo" : "artigos"} · {formatPrice(total)}
        </span>
      </Link>
    </div>
  );
}
