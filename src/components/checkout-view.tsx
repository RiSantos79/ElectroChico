"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode, type RefObject } from "react";
import { useCart, type CartLine } from "@/lib/cart-context";
import type { Product } from "@/data/catalog";
import type { Address } from "@/lib/api";
import { CONCELHOS } from "@/data/concelhos";
import { Price } from "@/components/price";
import { applyCouponAction, createOrderAction } from "@/lib/order-actions";
import { GIFT_CARD_CATEGORY_SLUG } from "@/lib/gift-cards";
import {
  BankIcon,
  CardIcon,
  EnvelopeIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  StoreIcon,
  UserIcon,
} from "@/components/checkout-icons";

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

const paymentMethods: { value: string; icon: ReactNode; label?: string; badge?: string }[] = [
  { value: "MB Way", icon: <MbWayBadge /> },
  { value: "Multibanco", icon: <BankIcon /> },
  { value: "Cartão de crédito", icon: <CardIcon /> },
  { value: "PayPal", icon: <PayPalBadge /> },
  { value: "Levantamento em Loja", icon: <StoreIcon />, label: "Levantamento em Loja", badge: "GRÁTIS" },
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

// Salta para o campo seguinte quando este fica cheio. Só avança em digitação
// "para a frente": se o cliente estiver a apagar, o cursor fica onde está, ou
// corrigir o código postal tornava-se impossível.
function advanceWhenFull(
  event: ChangeEvent<HTMLInputElement>,
  length: number,
  nextName: string,
) {
  const input = event.currentTarget;
  if (input.value.length < length) return;

  const next = input.form?.elements.namedItem(nextName);
  if (next instanceof HTMLInputElement) {
    next.focus();
    next.select();
  }
}

function formatAddress(address: Address): string {
  const floor = address.floor ? `, ${address.floor}` : "";
  return `${address.street} ${address.streetNumber}${floor}, ${address.postalCode} ${address.city}`;
}

// Preenche o formulário a partir de uma morada guardada. Escreve nos campos e
// dispara "input" porque alguns são controlados pelo React e, sem o evento, o
// valor aparecia no ecrã mas não no estado.
function SavedAddressPicker({
  addresses,
  formRef,
}: {
  addresses: Address[];
  formRef: RefObject<HTMLFormElement | null>;
}) {
  const [selected, setSelected] = useState("");

  function fill(id: string) {
    setSelected(id);
    const address = addresses.find((a) => a.id === id);
    const form = formRef.current;
    if (!address || !form) return;

    const [code4 = "", code3 = ""] = address.postalCode.split("-");
    const values: Record<string, string> = {
      street: address.street,
      streetNumber: address.streetNumber,
      floor: address.floor ?? "",
      postalCode4: code4,
      postalCode3: code3,
      city: address.city,
      concelho: address.concelho ?? "",
      customerPhone: address.phone ?? "",
    };

    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = value;
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }

  return (
    <label className="mb-4 flex flex-col gap-1 text-xs text-muted">
      Usar uma morada guardada
      <select
        value={selected}
        onChange={(e) => fill(e.target.value)}
        className="input-field w-full text-sm"
      >
        <option value="">Preencher à mão</option>
        {addresses.map((address) => (
          <option key={address.id} value={address.id}>
            {address.label ? `${address.label} — ` : ""}
            {formatAddress(address)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckoutView({ products, addresses = [] }: { products: Product[]; addresses?: Address[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { lines } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);

  const items = lines
    .map((line) => ({ line, product: products.find((p) => p.slug === line.slug) }))
    .filter((entry): entry is { line: CartLine; product: Product } => Boolean(entry.product));
  const subtotal = items.reduce((sum, { line, product }) => sum + product.price * line.qty, 0);
  const giftCardItems = items.filter(({ product }) => product.category === GIFT_CARD_CATEGORY_SLUG);
  const total = subtotal - (appliedCoupon?.discountAmount ?? 0);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    const result = await applyCouponAction(
      couponInput.trim(),
      items.map(({ line, product }) => ({ productId: product.id, quantity: line.qty })),
    );
    setApplyingCoupon(false);
    if (result.error || result.discountAmount === undefined) {
      setCouponError(result.error ?? "Não foi possível aplicar o código.");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: result.discountAmount });
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
      concelho: String(formData.get("concelho") || ""),
      newsletterOptIn: formData.get("newsletterOptIn") === "on",
      couponCode: appliedCoupon?.code,
      items: items.map(({ line, product }) => ({
        productId: product.id,
        quantity: line.qty,
        ...(product.category === GIFT_CARD_CATEGORY_SLUG
          ? {
              recipientEmail: String(formData.get(`recipientEmail-${product.slug}`) || "") || undefined,
              giftMessage: String(formData.get(`giftMessage-${product.slug}`) || "") || undefined,
            }
          : {}),
      })),
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // eslint-disable-next-line react-hooks/immutability -- navegação de browser, não mutação de estado React
    if (result.checkoutUrl) window.location.href = result.checkoutUrl;
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Checkout</h1>
      <form ref={formRef} onSubmit={handleSubmit} className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
          <section className="rounded-xl border border-border bg-surface-raised p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Morada de entrega</h2>
            {addresses.length > 0 && (
              <SavedAddressPicker addresses={addresses} formRef={formRef} />
            )}
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
                    onChange={(e) => advanceWhenFull(e, 4, "postalCode3")}
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
                  onChange={(e) => advanceWhenFull(e, 3, "city")}
                  className="input-field w-16 shrink-0 text-center"
                />
              </div>
              <FieldWithIcon icon={<MapPinIcon />}>
                <input required name="city" placeholder="Localidade" className="input-field w-full pl-10" />
              </FieldWithIcon>
              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                Concelho
                <select required name="concelho" defaultValue="" className="input-field w-full text-sm">
                  <option value="" disabled>
                    Selecione o concelho
                  </option>
                  {CONCELHOS.map((concelho) => (
                    <option key={concelho} value={concelho}>
                      {concelho}
                    </option>
                  ))}
                </select>
              </label>
              <FieldWithIcon icon={<PhoneIcon />}>
                <input required type="tel" name="customerPhone" placeholder="Telemóvel" className="input-field w-full pl-10" />
              </FieldWithIcon>
              <FieldWithIcon icon={<EnvelopeIcon />}>
                <input required type="email" name="customerEmail" placeholder="Email" className="input-field w-full pl-10" />
              </FieldWithIcon>
            </div>
          </section>

          {giftCardItems.length > 0 && (
            <section className="rounded-xl border border-border bg-surface-raised p-6">
              <h2 className="mb-1 text-lg font-semibold text-foreground">Cartões presente</h2>
              <p className="mb-4 text-xs text-muted">
                Indique para quem é cada cartão. O código fica disponível na página de confirmação da encomenda,
                para reencaminhar a quem quiser.
              </p>
              <div className="space-y-4">
                {giftCardItems.map(({ product }) => (
                  <div key={product.slug} className="rounded-lg border border-border p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">{product.name}</p>
                    <FieldWithIcon icon={<EnvelopeIcon />} className="mb-2">
                      <input
                        required
                        type="email"
                        name={`recipientEmail-${product.slug}`}
                        placeholder="Email de quem vai receber o presente"
                        className="input-field w-full pl-10"
                      />
                    </FieldWithIcon>
                    <textarea
                      name={`giftMessage-${product.slug}`}
                      placeholder="Mensagem (opcional)"
                      rows={2}
                      className="input-field w-full resize-none"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

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
                  {method.label ?? (method.value !== "MB Way" && method.value !== "PayPal" && method.value)}
                  {method.badge && (
                    <span className="ml-auto rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold text-success">
                      {method.badge}
                    </span>
                  )}
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
                <Price amount={product.price * line.qty} />
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Cupão <span className="font-medium text-foreground">{appliedCoupon.code}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput("");
                  }}
                  className="text-xs text-muted underline hover:text-foreground"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Código de desconto"
                  className="input-field w-full min-w-0 flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="shrink-0 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyingCoupon ? "..." : "Aplicar"}
                </button>
              </div>
            )}
            {couponError && <p className="mt-1 text-xs text-danger">{couponError}</p>}
          </div>

          <div className="space-y-1 border-t border-border pt-4">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <Price amount={subtotal} />
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-success">
                <span>Desconto</span>
                <span>-<Price amount={appliedCoupon.discountAmount} /></span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>Total</span>
              <Price amount={total} />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-xs text-muted">
            <input type="checkbox" name="newsletterOptIn" className="mt-0.5 size-4 shrink-0" />
            Quero subscrever a Newsletter ElectroChico para receber novidades em primeira mão e comunicações
            personalizadas.
          </label>

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
