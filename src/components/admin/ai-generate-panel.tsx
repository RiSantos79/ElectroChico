"use client";

import { useRef, useState } from "react";
import { aiGenerateAction } from "@/lib/ai-actions";
import { readProductContext } from "./ai-button";
import type { AiFeatureKey } from "@/lib/api";

type Item = { feature: AiFeatureKey; label: string };

// Para funcionalidades cujo resultado é para ler e decidir, não para preencher
// um campo — sugestões de SEO, planos de campanha. Mostra o texto com um botão
// de copiar, em vez de inventarmos campos na base de dados só para o guardar.
export function AiGeneratePanel({
  items,
  source = "form",
  placeholder,
}: {
  items: Item[];
  /** "form" usa o produto do formulário à volta; "topic" pede um tema livre. */
  source?: "form" | "topic";
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ label: string; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(item: Item) {
    let context: Record<string, string>;

    if (source === "topic") {
      if (!topic.trim()) {
        setError("Escreva um tema primeiro.");
        return;
      }
      context = { topic: topic.trim() };
    } else {
      const form = ref.current?.closest("form");
      if (!form) return;
      context = readProductContext(form);
    }

    setBusy(item.feature);
    setError(null);
    setCopied(false);
    const res = await aiGenerateAction(item.feature, context);
    setBusy(null);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult({ label: item.label, text: res.text });
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
  }

  return (
    <div ref={ref} className="space-y-3">
      {source === "topic" && (
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={placeholder}
          className="input-field text-sm"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <button
            key={item.feature}
            type="button"
            onClick={() => run(item)}
            disabled={busy !== null}
            className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
          >
            {busy === item.feature ? "A gerar..." : `✨ ${item.label}`}
          </button>
        ))}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      {result && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">{result.label}</span>
            <button type="button" onClick={copy} className="text-xs font-medium text-accent hover:underline">
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{result.text}</p>
        </div>
      )}
    </div>
  );
}
