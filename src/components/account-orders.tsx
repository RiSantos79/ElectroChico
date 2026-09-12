import Link from "next/link";
import type { Order } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { customerLogoutAction } from "@/lib/customer-auth-actions";

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  FAILED: "Falhada",
  CANCELLED: "Cancelada",
};

const statusColor: Record<string, string> = {
  PENDING: "text-muted",
  PAID: "text-success",
  FAILED: "text-danger",
  CANCELLED: "text-muted",
};

export function AccountOrders({ name, orders }: { name?: string | null; orders: Order[] }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{name ? `Olá, ${name}` : "A minha conta"}</h1>
        <form action={customerLogoutAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Sair
          </button>
        </form>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-foreground">As minhas encomendas</h2>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
          <p className="text-sm text-muted">Ainda não fez nenhuma encomenda.</p>
          <Link
            href="/catalogo"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{new Date(order.createdAt).toLocaleString("pt-PT")}</span>
                <span className={`text-sm font-medium ${statusColor[order.status] ?? "text-muted"}`}>
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} × {item.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-right text-sm font-semibold text-foreground">
                {formatPrice(Number(order.total))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
