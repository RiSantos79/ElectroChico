import { redirect } from "next/navigation";
import { getAdminCustomerDetail, PAID_LIKE_STATUSES } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { CustomerOrdersTable } from "@/components/admin/customer-orders-table";

export const metadata = { title: "Cliente — Backoffice" };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { id } = await params;
  const { customer, orders } = await getAdminCustomerDetail(id, token);

  const totalSpent = orders
    .filter((o) => PAID_LIKE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{customer.name || "(sem nome)"}</h1>
        <p className="text-sm text-muted">{customer.email}</p>
        <p className="text-xs text-muted">Cliente desde {new Date(customer.createdAt).toLocaleDateString("pt-PT")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total gasto</p>
          <p className="mt-1 text-xl font-bold text-foreground">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Encomendas</p>
          <p className="mt-1 text-xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Moradas guardadas</p>
          <p className="mt-1 text-xl font-bold text-foreground">{customer.addresses.length}</p>
        </div>
      </div>

      {customer.addresses.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Moradas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {customer.addresses.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium text-foreground">
                  {a.label || "Morada"} {a.isDefault && <span className="text-xs text-accent">(principal)</span>}
                </p>
                <p className="text-muted">
                  {a.street}, {a.streetNumber}
                  {a.floor ? `, ${a.floor}` : ""}
                </p>
                <p className="text-muted">
                  {a.postalCode} {a.city}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Encomendas</h2>
        <CustomerOrdersTable orders={orders} />
      </section>
    </div>
  );
}
