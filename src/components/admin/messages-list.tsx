"use client";

import type { ContactMessage, ContactType } from "@/lib/api";
import { replyMessageAction } from "@/lib/admin-contact-actions";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

const typeLabel: Record<ContactType, string> = {
  SUGGESTION: "Sugestão",
  MESSAGE: "Mensagem",
  RMA: "RMA",
  QUOTE: "Orçamento",
};

export function MessagesList({ messages }: { messages: ContactMessage[] }) {
  const { query, setQuery, filtered } = useAdminSearch(
    messages,
    (m) => `${m.name} ${m.email} ${m.subject ?? ""} ${m.body} ${typeLabel[m.type]}`,
  );

  return (
    <div>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Pesquisar por nome, email ou assunto..."
        className="mb-4 max-w-sm"
      />
      <ul className="space-y-3">
        {filtered.map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-surface-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-medium text-foreground">{m.name}</span>{" "}
                <span className="text-muted">({m.email})</span>
              </div>
              <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString("pt-PT")}</span>
            </div>
            <div className="mt-1 text-xs font-medium text-accent">
              {typeLabel[m.type]}
              {(m.subject || m.productName) && ` — ${m.subject || m.productName}`}
              {m.orderId && ` — Encomenda: ${m.orderId}`}
            </div>
            <p className="mt-2 text-sm text-muted">{m.body}</p>

            {m.replies.map((r) => (
              <div
                key={r.id}
                className={`mt-3 rounded-lg border border-border p-3 text-sm ${r.fromAdmin ? "bg-surface" : "ml-6 bg-surface-raised"}`}
              >
                <div className="mb-1 text-xs font-medium text-success">
                  {r.fromAdmin ? "Resposta da loja" : "Resposta do cliente"} ·{" "}
                  {new Date(r.createdAt).toLocaleString("pt-PT")}
                </div>
                <p className="text-foreground">{r.body}</p>
              </div>
            ))}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">Responder</summary>
              <form action={replyMessageAction.bind(null, m.id)} className="mt-2 flex flex-col gap-2 sm:flex-row">
                <textarea
                  name="reply"
                  required
                  rows={2}
                  placeholder="Escreva a sua resposta..."
                  className="input-field w-full flex-1 resize-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
                >
                  Enviar
                </button>
              </form>
            </details>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-border p-8 text-center text-muted">
            {query.trim() ? `Nenhuma mensagem encontrada para "${query}".` : "Ainda não há mensagens."}
          </li>
        )}
      </ul>
    </div>
  );
}
