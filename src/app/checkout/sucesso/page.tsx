import Link from "next/link";
import QRCode from "qrcode";
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

  const giftCards = order?.giftCards ?? [];
  const giftCardQrCodes = await Promise.all(
    giftCards.map((gc) => QRCode.toDataURL(gc.code, { margin: 1, width: 160 })),
  );

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

      {giftCards.length > 0 && (
        <div className="mt-6 space-y-4 text-left">
          <h2 className="text-lg font-semibold text-foreground">Os seus cartões presente</h2>
          <p className="text-xs text-muted">
            O envio automático por email ainda não está ativo — guarde ou reencaminhe este código a quem quiser
            oferecer.
          </p>
          {giftCards.map((gc, i) => (
            <div key={gc.code} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={giftCardQrCodes[i]} alt={`QR do cartão ${gc.code}`} className="size-24 shrink-0 rounded-lg" />
              <div className="text-sm">
                <p className="font-mono text-base font-semibold tracking-wide text-foreground">{gc.code}</p>
                <p className="text-muted">Valor: {formatPrice(Number(gc.value))}</p>
                {gc.recipientEmail && <p className="text-muted">Para: {gc.recipientEmail}</p>}
              </div>
            </div>
          ))}
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
