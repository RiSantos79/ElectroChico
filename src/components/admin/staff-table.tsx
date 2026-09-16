"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ROLE_LABELS, type Staff } from "@/lib/api";
import {
  deleteStaffAction,
  deleteStaffsAction,
  forceStaffLogoutAction,
  updateStaffStatusAction,
} from "@/lib/admin-actions";
import { ConfirmDialog } from "./confirm-dialog";

const statusLabel: Record<string, string> = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", DISABLED: "Desativado" };
const statusColor: Record<string, string> = {
  ACTIVE: "text-success",
  SUSPENDED: "text-amber-500",
  DISABLED: "text-danger",
};

type SortKey = "name" | "role" | "status" | "lastLoginAt" | "mfaEnabled";
type PendingDelete = { type: "one"; id: string; name: string } | { type: "bulk"; ids: string[] };

function SortHeader({
  label,
  sortKeyName,
  activeKey,
  ascending,
  onSort,
}: {
  label: string;
  sortKeyName: SortKey;
  activeKey: SortKey | null;
  ascending: boolean;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKeyName)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {activeKey === sortKeyName && <span className="text-xs">{ascending ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function sortValue(s: Staff, key: SortKey): string | number {
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
  }
}

export function StaffTable({ staff, currentUserId }: { staff: Staff[]; currentUserId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => {
    if (!sortKey) return staff;
    return [...staff].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [staff, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const selectableIds = staff.filter((s) => s.id !== currentUserId).map((s) => s.id);
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
              <SortHeader label="Nome" sortKeyName="name" activeKey={sortKey} ascending={sortAsc} onSort={toggleSort} />
              <SortHeader label="Cargo / Role" sortKeyName="role" activeKey={sortKey} ascending={sortAsc} onSort={toggleSort} />
              <SortHeader label="Estado" sortKeyName="status" activeKey={sortKey} ascending={sortAsc} onSort={toggleSort} />
              <SortHeader
                label="Último login"
                sortKeyName="lastLoginAt"
                activeKey={sortKey}
                ascending={sortAsc}
                onSort={toggleSort}
              />
              <SortHeader label="MFA" sortKeyName="mfaEnabled" activeKey={sortKey} ascending={sortAsc} onSort={toggleSort} />
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
