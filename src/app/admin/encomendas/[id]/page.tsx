import { notFound, redirect } from "next/navigation";
import { getOrder } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { updateOrderAction } from "@/lib/admin-actions";

export const metadata = { title: "Encomenda — Backoffice" };

const statusOptions: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Paga" },
  { value: "PROCESSING", label: "A preparar" },
  { value: "SHIPPED", label: "Enviada" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "REFUNDED", label: "Reembolsada" },
  { value: "FAILED", label: "Falhada" },
];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Encomenda #{order.id.slice(-8)}</h1>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Cliente</h2>
        <p className="text-sm text-foreground">{order.customerName}</p>
        <p className="text-sm text-muted">{order.customerEmail}</p>
        {order.customerPhone && <p className="text-sm text-muted">{order.customerPhone}</p>}
        {order.street && (
          <p className="mt-2 text-sm text-muted">
            {order.street}, {order.streetNumber}
            {order.floor ? `, ${order.floor}` : ""}
            <br />
            {order.postalCode} {order.city}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Artigos</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span className="text-foreground">
                {item.productName} × {item.quantity}
              </span>
              <span className="text-muted">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.discountAmount && (
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm text-success">
            <span>Desconto {order.couponCode ? `(${order.couponCode})` : ""}</span>
            <span>-{formatPrice(Number(order.discountAmount))}</span>
          </div>
        )}
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold text-foreground">
          <span>Total</span>
          <span>{formatPrice(Number(order.total))}</span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Estado e envio</h2>
        <form action={updateOrderAction.bind(null, order.id)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Estado
            <select name="status" defaultValue={order.status} className="input-field">
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Transportadora
              <input name="trackingCarrier" defaultValue={order.trackingCarrier ?? ""} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Código de rastreio
              <input name="trackingCode" defaultValue={order.trackingCode ?? ""} className="input-field" />
            </label>
          </div>
          <p className="text-xs text-muted">
            Cancelar ou reembolsar uma encomenda já paga devolve automaticamente o stock reservado dos artigos.
          </p>
          <button
            type="submit"
            className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Guardar
          </button>
        </form>
      </section>
    </div>
  );
}
