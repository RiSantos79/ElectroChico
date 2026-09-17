import Link from "next/link";
import type { Product } from "@/data/catalog";
import { ProductMedia } from "@/components/product-media";
import { ProductStockBar } from "@/components/product-stock-bar";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { FavoriteButton } from "@/components/favorite-button";
import { CompareButton } from "@/components/compare-button";
import { Price } from "@/components/price";

const badgeLabel: Record<NonNullable<Product["badge"]>, string> = {
  promo: "Promoção",
  novo: "Novo",
  "mais-vendido": "Mais vendido",
};

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(100 - (product.price / product.oldPrice) * 100)
      : null;

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface-raised p-4 transition-shadow hover:shadow-lg hover:shadow-black/5">
      <Link href={`/produto/${product.slug}`} className="contents">
        <div className="relative">
          <ProductMedia
            color={product.color}
            name={product.name}
            image={product.images[0]}
            className="aspect-square w-full"
          />
          {product.badge && (
            <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {badgeLabel[product.badge]}
            </span>
          )}
          {discount && (
            <span className="absolute right-2 top-2 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-danger-foreground">
              -{discount}%
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">{product.brand}</span>
          <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <span aria-hidden>★</span>
            <span>{product.rating.toFixed(1)}</span>
            <span>({product.reviews})</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Price amount={product.price} className="text-lg font-semibold text-foreground" />
            {product.oldPrice && <Price amount={product.oldPrice} className="text-sm text-muted line-through" />}
          </div>
          <span className="mt-1 text-xs font-medium text-muted">
            Classe energética {product.energyClass}
          </span>
          <ProductStockBar product={product} compact className="mt-2" />
        </div>
      </Link>
      <div className="mt-3 flex gap-2">
        <AddToCartButton product={product} className="flex-1" />
        <FavoriteButton slug={product.slug} className="size-10" />
        <CompareButton slug={product.slug} className="size-10" />
      </div>
    </div>
  );
}
