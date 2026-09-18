"use client";

import { useRef, useState } from "react";
import { aiGenerateAction } from "@/lib/ai-actions";
import { splitLabelled } from "@/lib/ai-parse";
import type { AiFeatureKey } from "@/lib/api";

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function field(form: HTMLFormElement, name: string): FieldElement | null {
  const el = form.elements.namedItem(name);
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
    ? el
    : null;
}

// Lê o contexto a partir do próprio formulário: em selects usa a etiqueta
// visível (nome da marca/categoria), não o id, que ao modelo não diz nada.
export function readProductContext(form: HTMLFormElement): Record<string, string> {
  const value = (name: string) => {
    const el = field(form, name);
    if (!el) return "";
    if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.text ?? "";
    return el.value;
  };

  const context: Record<string, string> = {
    name: value("name"),
    brand: value("brandId"),
    category: value("categoryId"),
    price: value("price"),
    energyClass: value("energyClass"),
    specs: value("specs"),
    description: value("description"),
  };
  return Object.fromEntries(Object.entries(context).filter(([, v]) => v));
}

export function applyFields(form: HTMLFormElement, values: Record<string, string>) {
  for (const [name, value] of Object.entries(values)) {
    const target = field(form, name);
    if (!target) continue;
    target.value = value;
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function AiButton({
  feature,
  label,
  targetName,
  sourceName,
  className = "",
}: {
  feature: AiFeatureKey;
  label: string;
  /** Campo do formulário a preencher com o resultado. */
  targetName: string;
  /** Campo cujo texto atual serve de entrada (melhorar, corrigir, reescrever). */
  sourceName?: string;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const form = ref.current?.closest("form");
    if (!form) return;

    setBusy(true);
    setError(null);

    const context = readProductContext(form);
    if (sourceName) {
      const source = field(form, sourceName);
      const text = source?.value.trim();
      if (!text) {
        setBusy(false);
        setError("Não há texto para usar.");
        return;
      }
      context.text = text;
    }

    const result = await aiGenerateAction(feature, context);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const target = field(form, targetName);
    if (!target) {
      setError("Campo de destino não encontrado.");
      return;
    }
    target.value = result.text;
    // Alguns campos são controlados por React (ex. slug) — o evento garante
    // que o estado acompanha o valor escrito aqui.
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
      >
        {busy ? "A gerar..." : `✨ ${label}`}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}

// Variante para os prompts de marketing: o contexto não é um produto do
// formulário, é um tema escrito pelo gestor ("saldos de verão"), e o resultado
// chega rotulado, preenchendo vários campos de uma vez.
export function AiTopicFillButton({
  feature,
  label,
  placeholder,
  fields,
}: {
  feature: AiFeatureKey;
  label: string;
  placeholder: string;
  /** Rótulo devolvido pelo modelo → nome do campo do formulário. */
  fields: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const form = ref.current?.closest("form");
    if (!form) return;
    if (!topic.trim()) {
      setError("Escreva um tema primeiro.");
      return;
    }

    setBusy(true);
    setError(null);
    const result = await aiGenerateAction(feature, { topic: topic.trim() });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const { values } = splitLabelled(result.text, fields);
    if (Object.keys(values).length === 0) {
      setError("O modelo devolveu um formato inesperado. Tente outra vez.");
      return;
    }
    applyFields(form, values);
  }

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2">
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={placeholder}
        className="input-field h-8 flex-1 text-xs"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
      >
        {busy ? "A gerar..." : `✨ ${label}`}
      </button>
      {error && <span className="w-full text-xs text-danger">{error}</span>}
    </div>
  );
}
