"use client";

import { useState } from "react";
import Link from "next/link";
import { ROLE_LABELS, type Staff } from "@/lib/api";
import {
  deleteStaffAction,
  deleteStaffsAction,
  forceStaffLogoutAction,
  updateStaffStatusAction,
} from "@/lib/admin-actions";
import { ConfirmDialog } from "./confirm-dialog";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

const statusLabel: Record<string, string> = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", DISABLED: "Desativado" };
const statusColor: Record<string, string> = {
  ACTIVE: "text-success",
  SUSPENDED: "text-amber-500",
  DISABLED: "text-danger",
};

type PendingDelete = { type: "one"; id: string; name: string } | { type: "bulk"; ids: string[] };

function sortValue(s: Staff, key: string): string | number {
  switch (key) {
    case "name":
      return (s.name ?? s.email).toLowerCase();
    case "role":
      return ROLE_LABELS[s.role];
    case "status":
      return s.status;
    case "lastLoginAt":
      return s.lastLoginAt ?? "";
    case "mfaEnabled":
      return s.mfaEnabled ? 1 : 0;
    default:
      return "";
  }
}

export function StaffTable({ staff, currentUserId }: { staff: Staff[]; currentUserId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { query, setQuery, filtered } = useAdminSearch(
    staff,
    (s) => `${s.name ?? ""} ${s.email} ${ROLE_LABELS[s.role]}`,
  );
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, sortValue);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

  const selectableIds = filtered.filter((s) => s.id !== currentUserId).map((s) => s.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmDelete() {
    if (!pending) return;
    setBusy(true);
    const result = pending.type === "one" ? await deleteStaffAction(pending.id) : await deleteStaffsAction(pending.ids);
    setBusy(false);
    setPending(null);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    if (pending.type === "bulk") setSelected(new Set());
  }

  return (
    <div>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Pesquisar por nome, email ou role..."
        className="mb-3 max-w-sm"
      />
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5">
          <span className="text-sm text-foreground">{selected.size} selecionado(s)</span>
          <button
            type="button"
            onClick={() => setPending({ type: "bulk", ids: Array.from(selected) })}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Apagar selecionados
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4" />
              </th>
              <SortableHeader label="Nome" sortKey="name" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader label="Cargo / Role" sortKey="role" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader label="Estado" sortKey="status" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader
                label="Último login"
                sortKey="lastLoginAt"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
              <SortableHeader label="MFA" sortKey="mfaEnabled" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((s) => {
              const isSelf = s.id === currentUserId;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    {!isSelf && (
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="size-4"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {s.name ?? "—"} {isSelf && <span className="text-xs text-muted">(você)</span>}
                    </p>
                    <p className="text-xs text-muted">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.jobTitle && <p>{s.jobTitle}</p>}
                    <p>{ROLE_LABELS[s.role]}</p>
                  </td>
                  <td className={`px-4 py-3 font-medium ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                    {s.mustChangePassword && (
                      <p className="text-xs font-normal text-amber-500">Password pendente de troca</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("pt-PT") : "Nunca"}
                    {s.lastLoginIp && <p className="text-xs">{s.lastLoginIp}</p>}
                  </td>
                  <td className={`px-4 py-3 font-medium ${s.mfaEnabled ? "text-success" : "text-muted"}`}>
                    {s.mfaEnabled ? "Ativo" : "Inativo"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-3">
                      <Link href={`/admin/utilizadores/${s.id}`} className="font-medium text-accent hover:underline">
                        Editar
                      </Link>
                      {!isSelf && (
                        <>
                          <form action={updateStaffStatusAction.bind(null, s.id, s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>
                            <button type="submit" className="font-medium text-accent hover:underline">
                              {s.status === "ACTIVE" ? "Suspender" : "Reativar"}
                            </button>
                          </form>
                          {s.status !== "DISABLED" && (
                            <form action={updateStaffStatusAction.bind(null, s.id, "DISABLED")}>
                              <button type="submit" className="font-medium text-muted hover:underline">
                                Desativar
                              </button>
                            </form>
                          )}
                          <form action={forceStaffLogoutAction.bind(null, s.id)}>
                            <button type="submit" className="font-medium text-accent hover:underline">
                              Forçar logout
                            </button>
                          </form>
                          <button
                            type="button"
                            onClick={() => setPending({ type: "one", id: s.id, name: s.name ?? s.email })}
                            className="font-medium text-danger hover:underline"
                          >
                            Apagar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {query.trim() ? `Nenhum utilizador encontrado para "${query}".` : "Ainda não há utilizadores."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pending && (
        <ConfirmDialog
          message={
            pending.type === "one"
              ? `Apagar "${pending.name}"? Esta ação não pode ser desfeita.`
              : `Apagar ${pending.ids.length} funcionário(s) selecionado(s)? Esta ação não pode ser desfeita.`
          }
          confirmLabel="Apagar"
          danger
          pending={busy}
          onCancel={() => setPending(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
