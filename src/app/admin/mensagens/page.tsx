import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContactMessages, type ContactType } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">De</th>
              <th className="px-4 py-3 font-medium">Assunto / Artigo</th>
              <th className="px-4 py-3 font-medium">Mensagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {messages.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {new Date(m.createdAt).toLocaleString("pt-PT")}
                </td>
                <td className="px-4 py-3 text-muted">{typeLabel[m.type]}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{m.name}</div>
                  <div className="text-xs text-muted">{m.email}</div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {m.subject || m.productName || "—"}
                  {m.orderId && <div className="text-xs">Encomenda: {m.orderId}</div>}
                </td>
                <td className="max-w-xs px-4 py-3 text-muted">{m.body}</td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Ainda não há mensagens.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
