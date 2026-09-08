"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { ProductMedia } from "@/components/product-media";

export function CartView({ products }: { products: Product[] }) {
  const { lines, removeItem, setQty } = useCart();

  const items: { line: { slug: string; qty: number }; product: Product }[] = [];
  for (const line of lines) {
    const product = products.find((p) => p.slug === line.slug);
    if (product) items.push({ line, product });
  }

  const subtotal = items.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center lg:px-10">
        <h1 className="text-2xl font-bold text-foreground">O seu carrinho está vazio</h1>
        <p className="mt-2 text-sm text-muted">Explore o catálogo e adicione produtos ao carrinho.</p>
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
      <h1 className="mb-6 text-2xl font-bold text-foreground">Carrinho</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map(({ line, product }) => (
            <li
              key={product.slug}
              className="flex gap-4 rounded-xl border border-border bg-surface-raised p-4"
            >
              <ProductMedia
                color={product.color}
                name={product.name}
                image={product.images[0]}
                className="size-24 shrink-0"
              />
              <div className="flex flex-1 flex-col">
                <Link href={`/produto/${product.slug}`} className="font-medium text-foreground hover:text-accent">
                  {product.name}
                </Link>
                <span className="text-sm text-muted">{formatPrice(product.price)}</span>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => setQty(product.slug, line.qty - 1, product.stockQuantity)}
                      className="flex size-8 items-center justify-center text-lg"
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{line.qty}</span>
                    <button
                      type="button"
                      disabled={line.qty >= product.stockQuantity}
                      onClick={() => setQty(product.slug, line.qty + 1, product.stockQuantity)}
                      className="flex size-8 items-center justify-center text-lg disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(product.slug)}
                    className="text-sm text-danger hover:underline"
                  >
                    Remover
                  </button>
                </div>
                {line.qty >= product.stockQuantity && (
                  <p className="mt-1 text-xs text-danger">Só há {product.stockQuantity} em stock</p>
                )}
              </div>
              <span className="font-semibold text-foreground">{formatPrice(product.price * line.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Resumo</h2>
          <div className="mt-4 flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-muted">
            <span>Envio</span>
            <span>Grátis</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-accent px-6 py-3 text-center text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Finalizar compra
          </Link>
        </div>
      </div>
    </div>
  );
}
