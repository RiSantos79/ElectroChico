"use client";

import { useActionState } from "react";
import type { ContactMessage } from "@/lib/api";
import { sendMessageAction } from "@/lib/contact-actions";

export function AccountMessages({ messages }: { messages: ContactMessage[] }) {
  const [result, formAction] = useActionState(sendMessageAction, null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Enviar mensagem</h2>
        <form action={formAction} className="space-y-4">
          <input name="subject" placeholder="Assunto" className="input-field w-full" />
          <textarea required name="body" rows={4} placeholder="A sua mensagem" className="input-field w-full resize-none" />
          {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
          {result === "ok" && <p className="text-sm text-success">Mensagem enviada com sucesso.</p>}
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Enviar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Histórico</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-muted">Ainda não enviou nenhuma mensagem.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{m.subject || "(sem assunto)"}</span>
                  <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString("pt-PT")}</span>
                </div>
                <p className="mt-1 text-muted">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
