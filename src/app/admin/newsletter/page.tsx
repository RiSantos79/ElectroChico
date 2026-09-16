import Link from "next/link";
import { redirect } from "next/navigation";
import { getNewsletterCampaigns, getNewsletterSubscribers } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { NewsletterSubscribersTable } from "@/components/admin/newsletter-subscribers-table";
import { createCampaignAction, deleteCampaignAction, sendCampaignAction } from "@/lib/newsletter-actions";

export const metadata = { title: "Newsletter — Backoffice" };

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { resultado } = await searchParams;
  const [subscribers, campaigns] = await Promise.all([
    getNewsletterSubscribers(token),
    getNewsletterCampaigns(token),
  ]);

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Newsletter</h1>

      {resultado?.startsWith("enviado-") && (
        <p className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          Campanha enviada a {resultado.split("-")[1]} subscritor(es).
        </p>
      )}
      {resultado === "nao-configurado" && (
        <p className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted">
          O envio de email ainda não está configurado — a campanha ficou guardada como rascunho.
        </p>
      )}

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Subscritores ativos ({subscribers.length})
          </h2>
          <Link
            href="/admin/newsletter/export"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Exportar CSV
          </Link>
        </div>
        <NewsletterSubscribersTable subscribers={subscribers} />
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Nova campanha</h2>
        <form action={createCampaignAction} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            Assunto
            <input name="subject" required className="input-field" />
          </label>
          <div className="flex flex-col gap-1 text-sm">
            Conteúdo
            <RichTextEditor name="body" />
          </div>
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Guardar rascunho
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Campanhas ({campaigns.length})</h2>
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{c.subject}</p>
                  <p className="text-xs text-muted">
                    {c.status === "SENT"
                      ? `Enviada em ${new Date(c.sentAt!).toLocaleString("pt-PT")} a ${c.sentCount} subscritor(es)`
                      : "Rascunho"}
                  </p>
                </div>
                {c.status === "DRAFT" && (
                  <div className="flex gap-3">
                    <form action={sendCampaignAction.bind(null, c.id)}>
                      <button type="submit" className="text-sm font-medium text-accent hover:underline">
                        Enviar
                      </button>
                    </form>
                    <form action={deleteCampaignAction.bind(null, c.id)}>
                      <button type="submit" className="text-sm font-medium text-danger hover:underline">
                        Apagar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
          {campaigns.length === 0 && <p className="text-sm text-muted">Ainda não há campanhas.</p>}
        </ul>
      </section>
    </div>
  );
}
