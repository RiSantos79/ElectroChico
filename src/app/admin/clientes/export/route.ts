import { getAdminCustomers, logDataExport, type AdminCustomer } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return new Response("Não autenticado", { status: 401 });

  const customers = await getAdminCustomers(token);
  await logDataExport("Customer", customers.length, token);
  const csv = toCsv<AdminCustomer>(customers, [
    { label: "Nome", value: (c) => c.name ?? "" },
    { label: "Email", value: (c) => c.email },
    { label: "Cliente desde", value: (c) => new Date(c.createdAt).toLocaleDateString("pt-PT") },
    { label: "Encomendas", value: (c) => c.orderCount },
    { label: "Total Gasto", value: (c) => c.totalSpent },
    { label: "Última Encomenda", value: (c) => (c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-PT") : "") },
  ]);

  return csvResponse(csv, `clientes-${new Date().toISOString().slice(0, 10)}.csv`);
}
