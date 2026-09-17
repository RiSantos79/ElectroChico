"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecommendationSettings } from "@/lib/api";
import { updateRecommendationSettingsAction } from "@/lib/recommendation-actions";
import { SuccessDialog } from "./success-dialog";

export function RecommendationSettingsForm({ settings }: { settings: RecommendationSettings }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [strategy, setStrategy] = useState(settings.strategy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setBusy(true);
    setError(null);
    const result = await updateRecommendationSettingsAction(new FormData(formRef.current));
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Motor de recomendações</h2>
          <p className="mb-4 text-xs text-muted">
            Define quem escolhe os produtos sugeridos na loja. As regras funcionam sempre, sem depender de
            serviços externos.
          </p>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input
                type="radio"
                name="strategy"
                value="RULES"
                checked={strategy === "RULES"}
                onChange={() => setStrategy("RULES")}
                className="mt-1 size-4"
              />
              <span>
                <span className="block font-medium text-foreground">Regras (recomendado)</span>
                <span className="block text-xs text-muted">
                  Categoria, marca, proximidade de preço e histórico real de compras.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input
                type="radio"
                name="strategy"
                value="ML"
                checked={strategy === "ML"}
                onChange={() => setStrategy("ML")}
                className="mt-1 size-4"
              />
              <span>
                <span className="block font-medium text-foreground">
                  Modelo de Machine Learning{" "}
                  {!settings.mlAvailable && <span className="text-xs font-normal text-amber-500">(ainda indisponível)</span>}
                </span>
                <span className="block text-xs text-muted">
                  A ligação está preparada, mas nenhum modelo está implementado — enquanto assim for, a loja
                  continua a usar as regras, sem erros.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Regras</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Produtos a sugerir
              <input
                type="number"
                name="limit"
                min={1}
                max={12}
                defaultValue={settings.limit}
                className="input-field"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Tolerância de preço (%)
              <input
                type="number"
                name="priceTolerancePct"
                min={0}
                max={200}
                defaultValue={settings.priceTolerancePct}
                className="input-field"
              />
              <span className="text-xs text-muted">
                Quanto o preço pode afastar-se do produto atual para ainda contar como relacionado.
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="preferSameBrand"
                defaultChecked={settings.preferSameBrand}
                className="size-4"
              />
              Dar prioridade a produtos da mesma marca
            </label>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="useCoPurchase"
                defaultChecked={settings.useCoPurchase}
                className="size-4"
              />
              Usar o histórico de encomendas (produtos comprados em conjunto)
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Serviço de modelos (futuro)</h2>
          <p className="mb-4 text-xs text-muted">
            Preenchido agora ou mais tarde — só é usado quando existir um modelo. A chave é guardada cifrada e
            nunca é devolvida ao backoffice.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Endpoint
              <input
                name="mlEndpoint"
                defaultValue={settings.mlEndpoint}
                placeholder="https://..."
                className="input-field"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Chave de API
              <input
                type="password"
                name="mlApiKey"
                autoComplete="off"
                placeholder={settings.mlApiKeyMasked ? `Guardada (${settings.mlApiKeyMasked})` : "Opcional"}
                className="input-field"
              />
            </label>
          </div>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "A guardar..." : "Guardar regras"}
        </button>
      </form>

      {success && (
        <SuccessDialog
          message="Regras de recomendação guardadas."
          onClose={() => {
            setSuccess(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
