"use client";

import { useState } from "react";
import { energyClasses } from "@/data/catalog";
import type { AdminProduct } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { StockBar } from "@/components/stock-bar";

const badgeOptions: { value: NonNullable<AdminProduct["badge"]>; label: string }[] = [
  { value: "PROMO", label: "Promoção" },
  { value: "NOVO", label: "Novo" },
  { value: "MAIS_VENDIDO", label: "Mais vendido" },
];

export function PriceStockFields({ product }: { product?: AdminProduct }) {
  const startPrice = product ? Number(product.price) : undefined;
  const startOldPrice = product?.oldPrice ? Number(product.oldPrice) : undefined;
  const startPct =
    startOldPrice && startPrice ? Math.round((1 - startPrice / startOldPrice) * 100) : undefined;

  const [badge, setBadge] = useState(product?.badge ?? "");
  const [basePrice, setBasePrice] = useState<number | "">(startOldPrice ?? startPrice ?? "");
  const [discountPct, setDiscountPct] = useState<number | "">(startPct ?? "");
  const [stockQuantity, setStockQuantity] = useState<number | "">(product?.stockQuantity ?? 0);

  const isPromo = badge === "PROMO";
  const base = typeof basePrice === "number" ? basePrice : 0;
  const pct = typeof discountPct === "number" ? discountPct : 0;
  const hasActiveDiscount = isPromo && pct > 0;
  const promoPrice = hasActiveDiscount ? Math.round(base * (1 - pct / 100) * 100) / 100 : base;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1 text-sm">
        Quantidade em stock
        <input
          type="number"
          name="stockQuantity"
          min="0"
          step="1"
          required
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value === "" ? "" : Number(e.target.value))}
          className="input-field"
        />
        <StockBar quantity={typeof stockQuantity === "number" ? stockQuantity : 0} className="mt-1" />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Destaque
        <select
          name="badge"
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          className="input-field"
        >
          <option value="">Sem destaque</option>
          {badgeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1 text-sm">
        Preço do artigo (€)
        <input
          type="number"
          step="0.01"
          min="0"
          required
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="input-field"
        />
        {isPromo && (
          <label className="mt-2 flex flex-col gap-1 text-xs text-muted">
            Percentagem de desconto (%)
            <input
              type="number"
              min="1"
              max="95"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value === "" ? "" : Number(e.target.value))}
              className="input-field"
            />
          </label>
        )}
        <input type="hidden" name="price" value={hasActiveDiscount ? promoPrice : base} />
        <input type="hidden" name="oldPrice" value={hasActiveDiscount ? base : ""} />
      </div>

      <div className="flex flex-col gap-1 text-sm">
        Preço promoção
        <div className="input-field bg-surface text-muted">
          {hasActiveDiscount ? formatPrice(promoPrice) : "— sem promoção ativa"}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Classe energética
        <select name="energyClass" required defaultValue={product?.energyClass} className="input-field">
          {energyClasses.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1 text-sm">
        Imagens
        <input type="hidden" name="existingImages" defaultValue={(product?.images ?? []).join(",")} />
        {product && product.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {product.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <label key={url} className="group relative block overflow-hidden rounded-lg border border-border">
                <img src={url} alt="" className="aspect-square w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 text-xs font-medium text-white opacity-0 group-has-[input:checked]:opacity-100 group-hover:opacity-100">
                  <input type="checkbox" name="removeImages" value={url} className="accent-danger" />
                  Remover
                </span>
              </label>
            ))}
          </div>
        )}
        <input
          type="file"
          name="newImages"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="input-field"
        />
      </div>
    </div>
  );
}
