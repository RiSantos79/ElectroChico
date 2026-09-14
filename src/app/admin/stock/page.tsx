import Link from "next/link";
import { redirect } from "next/navigation";
import { getStockMovements } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export const metadata = { title: "Movimentos de stock — Backoffice" };

const typeLabel: Record<string, string> = {
  SALE: "Venda",
  RESTOCK: "Reposição",
  ADJUSTMENT: "Ajuste manual",
  RETURN: "Devolução",
};

const typeColor: Record<string, string> = {
  SALE: "text-danger",
  RESTOCK: "text-success",
  ADJUSTMENT: "text-accent",
  RETURN: "text-success",
};

export default async function AdminStockPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const movements = await getStockMovements(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Movimentos de stock</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Quantidade</th>
              <th className="px-4 py-3 font-medium">Detalhe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-muted">{new Date(m.createdAt).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 font-medium text-foreground">{m.product.name}</td>
                <td className={`px-4 py-3 font-medium ${typeColor[m.type] ?? "text-muted"}`}>
                  {typeLabel[m.type] ?? m.type}
                </td>
                <td className={`px-4 py-3 font-medium ${m.delta >= 0 ? "text-success" : "text-danger"}`}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </td>
                <td className="px-4 py-3 text-muted">
                  {m.orderId ? (
                    <Link href={`/admin/encomendas/${m.orderId}`} className="text-accent hover:underline">
                      Encomenda #{m.orderId.slice(-8)}
                    </Link>
                  ) : (
                    (m.reason ?? "—")
                  )}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Ainda não há movimentos de stock registados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
