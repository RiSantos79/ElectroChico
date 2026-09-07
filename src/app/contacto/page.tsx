"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Contacto</h1>
      <p className="mt-2 text-sm text-muted">
        Tem alguma dúvida? Preencha o formulário e a nossa equipa responde o mais rápido possível.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-foreground">
          Mensagem enviada. Obrigado pelo contacto!
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="mt-8 space-y-4"
        >
          <input required placeholder="Nome" className="input-field w-full" />
          <input required type="email" placeholder="Email" className="input-field w-full" />
          <input placeholder="Assunto" className="input-field w-full" />
          <textarea required placeholder="Mensagem" rows={5} className="input-field w-full resize-none" />
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Enviar mensagem
          </button>
        </form>
      )}
    </div>
  );
}
