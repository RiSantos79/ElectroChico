"use client";

import { useActionState } from "react";
import { sendPublicContactAction } from "@/lib/contact-actions";

export default function ContactPage() {
  const [result, formAction, pending] = useActionState(sendPublicContactAction, null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Contacto</h1>
      <p className="mt-2 text-sm text-muted">
        Tem alguma dúvida? Preencha o formulário e a nossa equipa responde o mais rápido possível.
      </p>

      {result === "ok" ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-foreground">
          Mensagem enviada. Obrigado pelo contacto!
        </div>
      ) : (
        <form action={formAction} className="mt-8 space-y-4">
          <input name="name" required placeholder="Nome" className="input-field w-full" />
          <input name="email" required type="email" placeholder="Email" className="input-field w-full" />
          <input name="subject" placeholder="Assunto" className="input-field w-full" />
          <textarea name="body" required placeholder="Mensagem" rows={5} className="input-field w-full resize-none" />
          {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "A enviar..." : "Enviar mensagem"}
          </button>
        </form>
      )}
    </div>
  );
}
