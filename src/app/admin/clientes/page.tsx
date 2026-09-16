import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminCustomers } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { CustomersTable } from "@/components/admin/customers-table";

export const metadata = { title: "Clientes — Backoffice" };

export default async function AdminCustomersPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const customers = await getAdminCustomers(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clientes ({customers.length})</h1>
        <Link
          href="/admin/clientes/export"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Exportar CSV
        </Link>
      </div>
      <CustomersTable customers={customers} />
    </div>
  );
}
