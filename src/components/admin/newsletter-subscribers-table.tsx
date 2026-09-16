"use client";

import type { NewsletterSubscriber } from "@/lib/api";
import { unsubscribeAction } from "@/lib/newsletter-actions";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";

function sortValue(s: NewsletterSubscriber, key: string): string | number {
  switch (key) {
    case "email":
      return s.email;
    case "name":
      return (s.name ?? "").toLowerCase();
    case "subscribedAt":
      return s.subscribedAt;
    default:
      return "";
  }
}

export function NewsletterSubscribersTable({ subscribers }: { subscribers: NewsletterSubscriber[] }) {
  const { sorted, sortKey, ascending, toggleSort } = useSortable(subscribers, sortValue);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Email" sortKey="email" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Nome" sortKey="name" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Subscrito em"
              sortKey="subscribedAt"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 text-foreground">{s.email}</td>
              <td className="px-4 py-3 text-muted">{s.name ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{new Date(s.subscribedAt).toLocaleDateString("pt-PT")}</td>
              <td className="px-4 py-3 text-right">
                <form action={unsubscribeAction.bind(null, s.id)}>
                  <button type="submit" className="font-medium text-danger hover:underline">
                    Remover
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {subscribers.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted">
                Ainda não há subscritores.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
