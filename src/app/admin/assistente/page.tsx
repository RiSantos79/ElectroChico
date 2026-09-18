import { redirect } from "next/navigation";
import { getAiStatus } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { AiAssistant } from "@/components/admin/ai-assistant";
import { AiGeneratePanel } from "@/components/admin/ai-generate-panel";

export const metadata = { title: "Assistente IA — Backoffice" };

export default async function AiAssistantPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { enabled } = await getAiStatus(token).catch(() => ({ enabled: false }));

  return (
    <div className="max-w-4xl space-y-6 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assistente IA</h1>
        <p className="mt-1 text-sm text-muted">
          Responde com base nos dados reais da loja (stock, vendas e encomendas dos últimos 30 dias).
        </p>
      </div>
      <AiAssistant enabled={enabled} />

      {enabled && (
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="text-lg font-semibold text-foreground">Ideias de campanha</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Propostas para ler e adaptar — nada é publicado automaticamente.
          </p>
          <AiGeneratePanel
            source="topic"
            placeholder="Tema (ex.: Black Friday, regresso às aulas, stock parado de máquinas de lavar)"
            items={[
              { feature: "MARKETING_CAMPAIGN", label: "Campanha promocional" },
              { feature: "MARKETING_SEASONAL", label: "Campanha sazonal" },
            ]}
          />
        </section>
      )}
    </div>
  );
}
