"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useCart, type CartLine } from "@/lib/cart-context";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { createOrderAction } from "@/lib/order-actions";
import { BankIcon, CardIcon, EnvelopeIcon, HomeIcon, MapPinIcon, PhoneIcon, UserIcon } from "@/components/checkout-icons";

function PayPalBadge() {
  return (
    <span className="text-base font-bold tracking-tight">
      <span style={{ color: "#003087" }}>Pay</span>
      <span style={{ color: "#009cde" }}>Pal</span>
    </span>
  );
}

function MbWayBadge() {
  return (
    <span className="text-base font-bold tracking-tight" style={{ color: "#d4007a" }}>
      MB <span className="font-medium">WAY</span>
    </span>
  );
}

const paymentMethods: { value: string; icon: ReactNode }[] = [
  { value: "MB Way", icon: <MbWayBadge /> },
  { value: "Multibanco", icon: <BankIcon /> },
  { value: "Cartão de crédito", icon: <CardIcon /> },
  { value: "PayPal", icon: <PayPalBadge /> },
];

function FieldWithIcon({
  icon,
  children,
  className = "",
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
      {children}
    </div>
  );
}

export function CheckoutView({ products }: { products: Product[] }) {
  const { lines } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = lines
    .map((line) => ({ line, product: products.find((p) => p.slug === line.slug) }))
    .filter((entry): entry is { line: CartLine; product: Product } => Boolean(entry.product));
  const subtotal = items.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createOrderAction({
      customerName: String(formData.get("customerName") || ""),
      customerEmail: String(formData.get("customerEmail") || ""),
      customerPhone: String(formData.get("customerPhone") || ""),
      street: String(formData.get("street") || ""),
      streetNumber: String(formData.get("streetNumber") || ""),
      floor: String(formData.get("floor") || "") || undefined,
      postalCode: `${formData.get("postalCode4") || ""}-${formData.get("postalCode3") || ""}`,
      city: String(formData.get("city") || ""),
      items: items.map(({ line, product }) => ({ productId: product.id, quantity: line.qty })),
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (result.checkoutUrl) window.location.href = result.checkoutUrl;
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Checkout</h1>
      <form onSubmit={handleSubmit} className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
          <section className="rounded-xl border border-border bg-surface-raised p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Morada de entrega</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWithIcon icon={<UserIcon />} className="sm:col-span-2">
                <input required name="customerName" placeholder="Nome completo" className="input-field w-full pl-10" />
              </FieldWithIcon>
              <FieldWithIcon icon={<HomeIcon />} className="sm:col-span-2">
                <input required name="street" placeholder="Morada" className="input-field w-full pl-10" />
              </FieldWithIcon>
              <input required name="streetNumber" placeholder="Número" className="input-field w-full" />
              <input name="floor" placeholder="Andar (se aplicável)" className="input-field w-full" />
              <div className="flex items-center gap-2">
                <FieldWithIcon icon={<MapPinIcon />} className="flex-1">
                  <input
                    required
                    name="postalCode4"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="0000"
                    className="input-field w-full pl-10"
                  />
                </FieldWithIcon>
                <span className="text-muted">-</span>
                <input
                  required
                  name="postalCode3"
                  inputMode="numeric"
                  pattern="[0-9]{3}"
                  maxLength={3}
                  placeholder="000"
                  className="input-field w-16 shrink-0 text-center"
                />
              </div>
              <FieldWithIcon icon={<MapPinIcon />}>
                <input required name="city" placeholder="Localidade" className="input-field w-full pl-10" />
              </FieldWithIcon>
              <FieldWithIcon icon={<PhoneIcon />}>
                <input required type="tel" name="customerPhone" placeholder="Telemóvel" className="input-field w-full pl-10" />
              </FieldWithIcon>
              <FieldWithIcon icon={<EnvelopeIcon />}>
                <input required type="email" name="customerEmail" placeholder="Email" className="input-field w-full pl-10" />
              </FieldWithIcon>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-raised p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Método de pagamento</h2>
            <p className="mb-4 text-xs text-muted">
              Escolhes o método exato na página segura de pagamento, a seguir.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.value}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm text-muted"
                >
                  {method.icon}
                  {method.value !== "MB Way" && method.value !== "PayPal" && method.value}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="h-fit space-y-4 rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <h2 className="text-lg font-semibold text-foreground">Resumo da encomenda</h2>
          <ul className="space-y-2 text-sm text-muted">
            {items.map(({ line, product }) => (
              <li key={product.slug} className="flex justify-between">
                <span>
                  {product.name} × {line.qty}
                </span>
                <span>{formatPrice(product.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "A processar..." : "Finalizar encomenda"}
          </button>
          <Link href="/carrinho" className="block text-center text-sm text-muted hover:text-foreground">
            Cancelar
          </Link>
        </section>
      </form>
    </div>
  );
}
