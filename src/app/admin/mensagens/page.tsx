import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContactMessages, type ContactType } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { replyMessageAction } from "@/lib/admin-contact-actions";

export const metadata = { title: "Mensagens — Backoffice" };

const typeLabel: Record<ContactType, string> = {
  SUGGESTION: "Sugestão",
  MESSAGE: "Mensagem",
  RMA: "RMA",
};

const tabs: { value: ContactType | undefined; label: string }[] = [
  { value: undefined, label: "Todas" },
  { value: "SUGGESTION", label: "Sugestões" },
  { value: "MESSAGE", label: "Mensagens" },
  { value: "RMA", label: "RMA" },
];

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { type } = await searchParams;
  const activeType = (type as ContactType | undefined) ?? undefined;
  const messages = await getAdminContactMessages(token, activeType);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Mensagens ({messages.length})</h1>

      <div className="mb-6 flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/mensagens?type=${tab.value}` : "/admin/mensagens"}
            className={`rounded-full px-4 py-1.5 text-sm ${
              activeType === tab.value
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <ul className="space-y-3">
        {messages.map((m) => (
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

            {m.reply && (
              <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-sm">
                <div className="mb-1 text-xs font-medium text-success">
                  Respondido em {m.repliedAt ? new Date(m.repliedAt).toLocaleString("pt-PT") : ""}
                </div>
                <p className="text-foreground">{m.reply}</p>
              </div>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">
                {m.reply ? "Editar resposta" : "Responder"}
              </summary>
              <form action={replyMessageAction.bind(null, m.id)} className="mt-2 flex flex-col gap-2 sm:flex-row">
                <textarea
                  name="reply"
                  required
                  defaultValue={m.reply ?? ""}
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
        {messages.length === 0 && (
          <li className="rounded-xl border border-border p-8 text-center text-muted">Ainda não há mensagens.</li>
        )}
      </ul>
    </div>
  );
}
