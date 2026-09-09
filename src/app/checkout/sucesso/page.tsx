import Link from "next/link";
import { getOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrder(orderId) : null;

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center lg:px-10">
      <ClearCartOnMount />
      <h1 className="text-2xl font-bold text-foreground">Encomenda confirmada!</h1>
      <p className="mt-2 text-sm text-muted">
        Obrigado pela tua compra. Vais receber um email de confirmação em breve.
      </p>

      {order && (
        <div className="mt-6 space-y-2 rounded-xl border border-border bg-surface p-6 text-left text-sm">
          <p className="text-muted">
            Encomenda <span className="font-medium text-foreground">#{order.id.slice(-8)}</span>
          </p>
          <ul className="space-y-1 text-muted">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      )}

      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Voltar à loja
      </Link>
    </div>
  );
}
