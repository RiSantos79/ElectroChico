"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiSettings } from "@/lib/api";
import { removeAiKeyAction, testAiConnectionAction, updateAiSettingsAction } from "@/lib/ai-actions";
import { ConfirmDialog } from "./confirm-dialog";
import { SuccessDialog } from "./success-dialog";

export function AiSettingsForm({ settings }: { settings: AiSettings }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [provider, setProvider] = useState(settings.provider);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState(false);

  const current = settings.providers.find((p) => p.value === provider);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setBusy(true);
    setError(null);
    const result = await updateAiSettingsAction(new FormData(formRef.current));
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess("Definições de IA guardadas.");
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setTestResult(await testAiConnectionAction());
    setTesting(false);
  }

  async function handleRemoveKey() {
    setBusy(true);
    const result = await removeAiKeyAction();
    setBusy(false);
    setConfirmRemoveKey(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEnabled(false);
    setSuccess("Chave removida. A IA ficou desativada.");
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Estado</h2>
          <p className="mb-4 text-xs text-muted">
            Com a IA desativada, a loja e o backoffice funcionam exatamente como hoje — os botões de geração
            ficam simplesmente escondidos.
          </p>

          <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
            <span className="relative inline-flex h-6 w-14 items-center rounded-full bg-border transition-colors has-[:checked]:bg-accent">
              <input
                type="checkbox"
                name="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <span className="pointer-events-none absolute right-2 text-[9px] font-bold text-muted transition-opacity peer-checked:opacity-0">
                OFF
              </span>
              <span className="pointer-events-none absolute left-2 text-[9px] font-bold text-accent-foreground opacity-0 transition-opacity peer-checked:opacity-100">
                ON
              </span>
              <span className="pointer-events-none absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-8" />
            </span>
            <span className="font-medium text-foreground">Ativar Inteligência Artificial</span>
          </label>

          {enabled && !settings.configured && current?.requiresApiKey && (
            <p className="mt-3 text-xs text-amber-500">
              Falta configurar uma chave de API — sem ela a IA continua indisponível.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Fornecedor</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Fornecedor de IA
              <select
                name="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as typeof provider)}
                className="input-field"
              >
                {settings.providers.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Modelo
              <input
                name="model"
                defaultValue={settings.model}
                placeholder={current?.defaultModel}
                className="input-field"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Endereço da API (opcional)
              <input
                name="baseUrl"
                defaultValue={settings.baseUrl}
                placeholder={current?.defaultBaseUrl}
                className="input-field"
              />
              <span className="text-xs text-muted">
                Só é preciso para Azure, Ollama ou endpoints próprios. Em branco usa o endereço oficial.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Chave de API
              <input
                type="password"
                name="apiKey"
                autoComplete="off"
                placeholder={
                  settings.configured
                    ? `Guardada (${settings.apiKeyMasked}) — escreva uma nova para substituir`
                    : current?.requiresApiKey
                      ? "Colar a chave do fornecedor"
                      : "Este fornecedor não precisa de chave"
                }
                className="input-field"
              />
              <span className="text-xs text-muted">
                Guardada cifrada na base de dados e nunca devolvida ao backoffice. Só super administradores a
                podem alterar.
              </span>
            </label>
          </div>

          {settings.configured && (
            <button
              type="button"
              onClick={() => setConfirmRemoveKey(true)}
              className="mt-4 text-sm font-medium text-danger hover:underline"
            >
              Remover chave guardada
            </button>
          )}
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "A guardar..." : "Guardar definições"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
          >
            {testing ? "A testar..." : "Testar ligação"}
          </button>
          {testResult && (
            <span className={`text-sm font-medium ${testResult.ok ? "text-success" : "text-danger"}`}>
              {testResult.ok ? "✓" : "✕"} {testResult.message.slice(0, 160)}
            </span>
          )}
        </div>
      </form>

      {confirmRemoveKey && (
        <ConfirmDialog
          message="Remover a chave de API guardada? A IA fica desativada até configurar outra."
          confirmLabel="Remover"
          danger
          pending={busy}
          onCancel={() => setConfirmRemoveKey(false)}
          onConfirm={handleRemoveKey}
        />
      )}

      {success && (
        <SuccessDialog
          message={success}
          onClose={() => {
            setSuccess(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
