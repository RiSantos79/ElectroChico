"use client";

import type { SecurityAlert } from "@/lib/api";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

const typeLabel: Record<string, string> = {
  LOGIN_BLOCKED_LOCKOUT: "Conta bloqueada",
  STAFF_CREATE: "Administrador criado",
  ROLE_CHANGED: "Promoção a administrador",
  PERMISSIONS_CHANGED: "Permissões alteradas",
  DATA_EXPORT: "Exportação de dados",
  NEW_DEVICE_LOGIN: "Login de novo dispositivo",
};

function sortValue(a: SecurityAlert, key: string): string | number {
  switch (key) {
    case "type":
      return typeLabel[a.type] ?? a.type;
    case "message":
      return a.message;
    case "actor":
      return a.actor ?? "";
    case "createdAt":
      return a.createdAt;
    default:
      return "";
  }
}

export function SecurityAlertsTable({ alerts }: { alerts: SecurityAlert[] }) {
  const { query, setQuery, filtered } = useAdminSearch(
    alerts,
    (a) => `${typeLabel[a.type] ?? a.type} ${a.message} ${a.actor ?? ""}`,
  );
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, sortValue);

  return (
    <div>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Pesquisar por tipo, mensagem ou quem..."
        className="mb-3 max-w-sm"
      />
      <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Tipo" sortKey="type" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <th className="px-4 py-3 font-medium">Mensagem</th>
            <SortableHeader label="Quem" sortKey="actor" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Quando"
              sortKey="createdAt"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((a, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-medium text-amber-500">{typeLabel[a.type] ?? a.type}</td>
              <td className="px-4 py-3 text-foreground">{a.message}</td>
              <td className="px-4 py-3 text-muted">{a.actor ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{new Date(a.createdAt).toLocaleString("pt-PT")}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted">
                {query.trim() ? `Nenhum alerta encontrado para "${query}".` : "Sem alertas de segurança nos últimos 7 dias."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
