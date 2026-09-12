"use client";

import { useActionState, useState } from "react";
import { sendSuggestionAction } from "@/lib/contact-actions";

export function SuggestionForm() {
  const [result, formAction] = useActionState(sendSuggestionAction, null);
  const [consent, setConsent] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input required name="name" placeholder="Nome" className="input-field w-full" />
      <input required type="email" name="email" placeholder="Email" className="input-field w-full" />
      <input name="phone" placeholder="Contacto" className="input-field w-full" />
      <input name="subject" placeholder="Assunto" className="input-field w-full" />
      <textarea required name="body" rows={5} placeholder="Sugestão" className="input-field w-full resize-none" />

      <label className="flex items-start gap-2 text-xs text-muted">
        <input
          required
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4"
        />
        Autorizo o envio dos meus dados de acordo com o Regulamento Geral de Proteção de Dados.
      </label>

      {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
      {result === "ok" && <p className="text-sm text-success">Sugestão enviada. Obrigado pelo contacto!</p>}

      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Enviar
      </button>
    </form>
  );
}
