"use client";

import { useState } from "react";
import { aiAssistantAction } from "@/lib/ai-actions";

const SUGGESTIONS = [
  "Quais são os produtos com menos vendas este mês?",
  "Sugere uma promoção para aumentar as vendas dos frigoríficos.",
  "Cria uma campanha para a Black Friday.",
  "Mostra os produtos sem stock.",
];

type Message = { role: "user" | "assistant"; text: string };

export function AiAssistant({ enabled }: { enabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <p className="text-sm text-muted">
          O assistente está inativo porque a Inteligência Artificial está desativada. Pode ativá-la em{" "}
          <a href="/admin/definicoes/ia" className="text-accent hover:underline">
            Definições → Inteligência Artificial
          </a>
          .
        </p>
      </div>
    );
  }

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setBusy(true);
    setError(null);

    const result = await aiAssistantAction(trimmed);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages((prev) => [...prev, { role: "assistant", text: result.text }]);
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <p className="mb-3 text-sm text-muted">Experimente perguntar:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((m, i) => (
        <div
          key={i}
          className={`rounded-xl border p-4 text-sm ${
            m.role === "user"
              ? "ml-auto max-w-2xl border-accent/40 bg-accent/10 text-foreground"
              : "max-w-3xl border-border bg-surface-raised text-foreground"
          }`}
        >
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            {m.role === "user" ? "Pergunta" : "Assistente"}
          </p>
          <p className="whitespace-pre-wrap">{m.text}</p>
        </div>
      ))}

      {busy && <p className="text-sm text-muted">A pensar...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex gap-3"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunte alguma coisa sobre a loja..."
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="shrink-0 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Perguntar
        </button>
      </form>
    </div>
  );
}
