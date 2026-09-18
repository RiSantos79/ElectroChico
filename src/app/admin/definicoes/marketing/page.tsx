import Link from "next/link";
import { redirect } from "next/navigation";
import { getMarketingSettings, getNewsletterSubscribers } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { MarketingSettingsForm } from "@/components/admin/marketing-settings-form";

export const metadata = { title: "Email marketing — Backoffice" };

export default async function MarketingSettingsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  // Só super administradores podem ver esta página — a API devolve 403 a
  // qualquer outra conta, e aqui isso vira uma mensagem em vez de um erro.
  const [settings, subscribers] = await Promise.all([
    getMarketingSettings(token).catch(() => null),
    getNewsletterSubscribers(token).catch(() => []),
  ]);

  if (!settings) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Email marketing</h1>
        <p className="text-sm text-muted">Esta configuração está reservada a super administradores.</p>
      </div>
    );
  }

  const pending = subscribers.filter((s) => !s.unsubscribedAt).length;

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10">
      <div>
        <Link href="/admin/definicoes" className="text-sm font-medium text-accent hover:underline">
          ← Definições
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Email marketing (Sender.net)</h1>
        <p className="mt-1 text-sm text-muted">
          Opcional. A loja funciona na íntegra sem esta integração — o registo de subscritores e o
          consentimento continuam a ser guardados aqui, mesmo com a integração desligada.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <section className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Como está montado</h2>
          <p className="mb-2">
            A lista de subscritores e a prova de consentimento são nossas; o Sender recebe uma cópia e trata do
            envio. Por isso, apontar para uma conta Sender nova (na entrega ao cliente) não exige migração
            nenhuma: basta trocar a chave e o grupo e usar &quot;Sincronizar tudo&quot;.
          </p>
          <p>
            Neste momento há <strong className="text-foreground">{pending}</strong> subscritor(es) ativo(s) por
            sincronizar ou já sincronizados.
          </p>
        </section>

        <MarketingSettingsForm settings={settings} />

        <section className="rounded-xl border border-border bg-surface-raised p-6 text-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Estado da sincronização</h2>
          <dl className="space-y-2 text-muted">
            <div className="flex justify-between gap-4">
              <dt>Última sincronização</dt>
              <dd className="text-foreground">
                {settings.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString("pt-PT") : "Nunca"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Resultado</dt>
              <dd className="text-foreground">{settings.lastSyncResult ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Antes de enviar seja o que for, o domínio de envio tem de estar verificado no Sender (SPF, DKIM e
            DMARC). Sem isso, a API deles recusa os pedidos.
          </p>
        </section>
      </div>
    </div>
  );
}
