import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminCustomers } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Clientes — Backoffice" };

export default async function AdminCustomersPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const customers = await getAdminCustomers(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Clientes ({customers.length})</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3 font-medium">Encomendas</th>
              <th className="px-4 py-3 font-medium">Total gasto</th>
              <th className="px-4 py-3 font-medium">Última encomenda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${c.id}`} className="font-medium text-foreground hover:text-accent">
                    {c.name || "(sem nome)"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3 text-muted">{new Date(c.createdAt).toLocaleDateString("pt-PT")}</td>
                <td className="px-4 py-3 text-muted">{c.orderCount}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatPrice(c.totalSpent)}</td>
                <td className="px-4 py-3 text-muted">
                  {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-PT") : "—"}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Ainda não há clientes registados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
