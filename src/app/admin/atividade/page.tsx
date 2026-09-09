import { redirect } from "next/navigation";
import { getAuditLogs } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export const metadata = { title: "Atividade — Backoffice" };

const actionLabels: Record<string, string> = {
  LOGIN_SUCCESS: "Login bem-sucedido",
  LOGIN_FAILED: "Tentativa de login falhada",
  PRODUCT_CREATE: "Produto criado",
  PRODUCT_UPDATE: "Produto editado",
  PRODUCT_DELETE: "Produto apagado",
};

export default async function ActivityPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const logs = await getAuditLogs(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Atividade recente</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Quem</th>
              <th className="px-4 py-3 font-medium">Detalhe</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {actionLabels[log.action] ?? log.action}
                </td>
                <td className="px-4 py-3 text-muted">{log.actor ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {log.entity ? `${log.entity} ${log.entityId}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{log.ip ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Ainda não há atividade registada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
