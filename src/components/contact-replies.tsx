"use client";

import { useActionState, useState } from "react";
import type { ContactReply } from "@/lib/api";
import { sendCustomerReplyAction } from "@/lib/contact-actions";

export function ContactReplies({
  messageId,
  replies,
  path,
}: {
  messageId: string;
  replies: ContactReply[];
  path: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [result, formAction] = useActionState(sendCustomerReplyAction.bind(null, path, messageId), null);

  return (
    <div className="mt-3 space-y-2">
      {replies.map((r) => (
        <div
          key={r.id}
          className={`rounded-lg border border-border p-3 text-sm ${r.fromAdmin ? "bg-surface" : "ml-6 bg-surface-raised"}`}
        >
          <div className="mb-1 text-xs font-medium text-muted">
            {r.fromAdmin ? "Resposta da loja" : "A sua resposta"} · {new Date(r.createdAt).toLocaleString("pt-PT")}
          </div>
          <p className="text-foreground">{r.body}</p>
        </div>
      ))}

      {showForm ? (
        <form action={formAction} className="mt-2 flex gap-2">
          <textarea
            name="reply"
            required
            rows={2}
            placeholder="Escreva a sua resposta..."
            className="input-field w-full flex-1 resize-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Enviar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-accent hover:underline"
        >
          Responder
        </button>
      )}
      {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
    </div>
  );
}
