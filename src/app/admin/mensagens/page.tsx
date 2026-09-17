import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContactMessages, type ContactType } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { MessagesList } from "@/components/admin/messages-list";

export const metadata = { title: "Mensagens — Backoffice" };

const tabs: { value: ContactType | undefined; label: string }[] = [
  { value: undefined, label: "Todas" },
  { value: "SUGGESTION", label: "Sugestões" },
  { value: "MESSAGE", label: "Mensagens" },
  { value: "RMA", label: "RMA" },
  { value: "QUOTE", label: "Orçamentos" },
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

      <MessagesList messages={messages} />
    </div>
  );
}
