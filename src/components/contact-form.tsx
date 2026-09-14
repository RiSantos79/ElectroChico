"use client";

import { useActionState } from "react";
import { sendPublicContactAction } from "@/lib/contact-actions";

export function ContactForm() {
  const [result, formAction, pending] = useActionState(sendPublicContactAction, null);

  if (result === "ok") {
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-foreground">
        Mensagem enviada. Obrigado pelo contacto!
      </div>
    );
  }

  return (
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
  );
}
