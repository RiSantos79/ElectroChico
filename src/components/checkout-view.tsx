"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";

const paymentMethods = ["MB Way", "Multibanco", "Cartão de crédito", "PayPal"];

export function CheckoutView({ products }: { products: Product[] }) {
  const { lines, clear } = useCart();
  const [payment, setPayment] = useState(paymentMethods[0]);
  const [confirmed, setConfirmed] = useState(false);

  const items = lines
    .map((line) => ({ line, product: products.find((p) => p.slug === line.slug) }))
    .filter((entry) => entry.product);
  const subtotal = items.reduce((sum, { line, product }) => sum + product!.price * line.qty, 0);

  if (confirmed) {
    return (
      <div className="px-6 py-16 text-center lg:px-10">
        <h1 className="text-2xl font-bold text-foreground">Encomenda confirmada!</h1>
        <p className="mt-2 text-sm text-muted">
          Obrigado pela sua compra. Vai receber um email de confirmação em breve.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Voltar à loja
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center lg:px-10">
        <h1 className="text-2xl font-bold text-foreground">Não há nada para finalizar</h1>
        <p className="mt-2 text-sm text-muted">O seu carrinho está vazio.</p>
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
      <h1 className="mb-6 text-2xl font-bold text-foreground">Checkout</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmed(true);
          clear();
        }}
        className="grid gap-8 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface-raised p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Morada de entrega</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Nome completo" className="input-field sm:col-span-2" />
              <input required placeholder="Morada" className="input-field sm:col-span-2" />
              <input required placeholder="Código postal" className="input-field" />
              <input required placeholder="Localidade" className="input-field" />
              <input required type="tel" placeholder="Telemóvel" className="input-field" />
              <input required type="email" placeholder="Email" className="input-field" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-raised p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Método de pagamento</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {paymentMethods.map((method) => (
                <label
                  key={method}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                    payment === method ? "border-accent bg-surface" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === method}
                    onChange={() => setPayment(method)}
                    className="accent-accent"
                  />
                  {method}
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="h-fit space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Resumo da encomenda</h2>
          <ul className="space-y-2 text-sm text-muted">
            {items.map(({ line, product }) => (
              <li key={product!.slug} className="flex justify-between">
                <span>
                  {product!.name} × {line.qty}
                </span>
                <span>{formatPrice(product!.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Finalizar encomenda
          </button>
        </div>
      </form>
    </div>
  );
}
