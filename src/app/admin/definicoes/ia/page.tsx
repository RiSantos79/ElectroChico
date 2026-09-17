import Link from "next/link";
import { redirect } from "next/navigation";
import { getAiSettings, getAiUsage } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { AiSettingsForm } from "@/components/admin/ai-settings-form";

export const metadata = { title: "Inteligência Artificial — Backoffice" };

function formatUsd(value: number): string {
  return `$${value.toFixed(value < 0.01 ? 4 : 2)}`;
}

export default async function AiSettingsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  // Só super administradores podem ver esta página — a API devolve 403 a
  // qualquer outra conta, e aqui isso vira uma mensagem em vez de um erro.
  const [settings, usage] = await Promise.all([
    getAiSettings(token).catch(() => null),
    getAiUsage(token).catch(() => null),
  ]);

  if (!settings) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Inteligência Artificial</h1>
        <p className="text-sm text-muted">Esta configuração está reservada a super administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10">
      <div>
        <Link href="/admin/definicoes" className="text-sm font-medium text-accent hover:underline">
          ← Definições
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Inteligência Artificial</h1>
        <p className="mt-1 text-sm text-muted">
          Opcional. A plataforma funciona na íntegra sem IA — ative só quando tiver uma chave de API válida.
        </p>
      </div>

      <div className="max-w-3xl">
        <AiSettingsForm settings={settings} />
      </div>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Consumo por funcionalidade</h2>
        <p className="mb-4 text-xs text-muted">
          Custo estimado a partir da tabela de preços por modelo — serve para ordem de grandeza, não para
          faturação.
        </p>
        {!usage || usage.byFeature.length === 0 ? (
          <p className="text-sm text-muted">Ainda não há utilização registada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Funcionalidade</th>
                  <th className="px-4 py-3 font-medium">Utilizações</th>
                  <th className="px-4 py-3 font-medium">Tokens entrada</th>
                  <th className="px-4 py-3 font-medium">Tokens saída</th>
                  <th className="px-4 py-3 font-medium">Custo estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usage.byFeature.map((f) => (
                  <tr key={f.feature}>
                    <td className="px-4 py-3 font-medium text-foreground">{f.featureLabel}</td>
                    <td className="px-4 py-3 text-muted">{f.calls}</td>
                    <td className="px-4 py-3 text-muted">{f.promptTokens.toLocaleString("pt-PT")}</td>
                    <td className="px-4 py-3 text-muted">{f.completionTokens.toLocaleString("pt-PT")}</td>
                    <td className="px-4 py-3 text-foreground">{formatUsd(f.estimatedCostUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico de utilização</h2>
        {!usage || usage.recent.length === 0 ? (
          <p className="text-sm text-muted">Sem registos.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Quando</th>
                  <th className="px-4 py-3 font-medium">Funcionalidade</th>
                  <th className="px-4 py-3 font-medium">Modelo</th>
                  <th className="px-4 py-3 font-medium">Quem</th>
                  <th className="px-4 py-3 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usage.recent.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-muted">{new Date(r.createdAt).toLocaleString("pt-PT")}</td>
                    <td className="px-4 py-3 text-foreground">{r.featureLabel}</td>
                    <td className="px-4 py-3 text-muted">{r.model}</td>
                    <td className="px-4 py-3 text-muted">{r.actor ?? "—"}</td>
                    <td className={`px-4 py-3 font-medium ${r.success ? "text-success" : "text-danger"}`}>
                      {r.success ? "OK" : (r.errorMessage?.slice(0, 60) ?? "Falhou")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
