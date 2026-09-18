"use client";

import { useState } from "react";
import type { MarketingGroup, MarketingSettings } from "@/lib/api";
import {
  removeMarketingKeyAction,
  syncMarketingContactsAction,
  testMarketingConnectionAction,
  updateMarketingSettingsAction,
} from "@/lib/marketing-actions";

type Feedback = { tone: "ok" | "error"; text: string } | null;

export function MarketingSettingsForm({ settings }: { settings: MarketingSettings }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [groupId, setGroupId] = useState(settings.groupId);
  const [groups, setGroups] = useState<MarketingGroup[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(formData: FormData) {
    setBusy("save");
    setFeedback(null);
    const result = await updateMarketingSettingsAction(formData);
    setBusy(null);
    setFeedback(
      result.ok ? { tone: "ok", text: "Configuração guardada." } : { tone: "error", text: result.error },
    );
  }

  async function handleTest() {
    setBusy("test");
    setFeedback(null);
    const result = await testMarketingConnectionAction();
    setBusy(null);

    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    setGroups(result.groups);
    setFeedback({
      tone: "ok",
      text: result.groups.length
        ? `Ligação estabelecida. ${result.groups.length} grupo(s) encontrado(s).`
        : "Ligação estabelecida, mas a conta ainda não tem grupos. Crie um no Sender.",
    });
  }

  async function handleSync() {
    setBusy("sync");
    setFeedback(null);
    const result = await syncMarketingContactsAction();
    setBusy(null);
    setFeedback(
      result.ok
        ? { tone: "ok", text: `${result.synced} de ${result.total} contacto(s) sincronizado(s).` }
        : { tone: "error", text: result.error },
    );
  }

  async function handleRemoveKey() {
    setBusy("remove");
    const result = await removeMarketingKeyAction();
    setBusy(null);
    if (result.ok) setEnabled(false);
    setFeedback(
      result.ok ? { tone: "ok", text: "Chave removida e integração desligada." } : { tone: "error", text: result.error },
    );
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-5 rounded-xl border border-border bg-surface-raised p-6">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4"
          />
          <span className="font-medium text-foreground">Integração ativa</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          API Token do Sender
          <input
            type="password"
            name="apiKey"
            autoComplete="off"
            placeholder={settings.hasApiKey ? settings.apiKeyMasked : "Cole aqui o token"}
            className="input-field font-mono text-xs"
          />
          <span className="text-xs text-muted">
            {settings.hasApiKey
              ? "Deixe vazio para manter a chave atual. A chave nunca é devolvida ao navegador."
              : "A chave é guardada cifrada e nunca é exposta ao frontend."}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          ID do grupo de destino
          <input
            name="groupId"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="ex.: eZVD4w"
            className="input-field font-mono text-xs"
          />
          <span className="text-xs text-muted">
            O grupo do Sender para onde os subscritores são enviados. Use &quot;Testar ligação&quot; para ver os
            grupos disponíveis.
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy !== null}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === "save" ? "A guardar..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={busy !== null}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
          >
            {busy === "test" ? "A testar..." : "Testar ligação"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={busy !== null}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
          >
            {busy === "sync" ? "A sincronizar..." : "Sincronizar tudo"}
          </button>
          {settings.hasApiKey && (
            <button
              type="button"
              onClick={handleRemoveKey}
              disabled={busy !== null}
              className="rounded-full border border-danger/40 px-6 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {busy === "remove" ? "A remover..." : "Remover chave"}
            </button>
          )}
        </div>

        {feedback && (
          <p className={`text-sm ${feedback.tone === "ok" ? "text-success" : "text-danger"}`}>{feedback.text}</p>
        )}
      </form>

      {groups && groups.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Grupos na conta Sender</h2>
          <ul className="space-y-2 text-sm">
            {groups.map((group) => (
              <li key={group.id} className="flex items-center justify-between gap-4">
                <span className="text-foreground">
                  {group.title}{" "}
                  <span className="text-xs text-muted">({group.activeSubscribers} subscritor(es))</span>
                </span>
                <button
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className="font-mono text-xs text-accent hover:underline"
                >
                  {group.id} — usar
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Depois de escolher o grupo, grave a configuração.</p>
        </div>
      )}
    </div>
  );
}
