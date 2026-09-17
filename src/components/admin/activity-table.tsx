"use client";

import type { AuditLog } from "@/lib/api";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

function sortValue(log: AuditLog, key: string, actionLabels: Record<string, string>): string | number {
  switch (key) {
    case "createdAt":
      return log.createdAt;
    case "action":
      return actionLabels[log.action] ?? log.action;
    case "actor":
      return log.actor ?? "";
    case "entity":
      return log.entity ? `${log.entity} ${log.entityId}` : "";
    case "ip":
      return log.ip ?? "";
    default:
      return "";
  }
}

export function ActivityTable({
  logs,
  actionLabels,
}: {
  logs: AuditLog[];
  actionLabels: Record<string, string>;
}) {
  const { query, setQuery, filtered } = useAdminSearch(
    logs,
    (log) => `${log.actor ?? ""} ${actionLabels[log.action] ?? log.action} ${log.entity ?? ""} ${log.entityId ?? ""} ${log.ip ?? ""}`,
  );
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, (log, key) =>
    sortValue(log, key, actionLabels),
  );

  return (
    <div>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Pesquisa rápida dentro destes resultados..."
        className="mb-3 max-w-sm"
      />
      <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Data" sortKey="createdAt" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Ação" sortKey="action" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Quem" sortKey="actor" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Objeto afetado"
              sortKey="entity"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader label="IP" sortKey="ip" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleString("pt-PT")}</td>
              <td className="px-4 py-3 font-medium text-foreground">{actionLabels[log.action] ?? log.action}</td>
              <td className="px-4 py-3 text-muted">{log.actor ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{log.entity ? `${log.entity} ${log.entityId}` : "—"}</td>
              <td className="px-4 py-3 text-muted">{log.ip ?? "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted">
                Nenhum registo encontrado para estes filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
