"use client";

import { useActionState } from "react";
import type { Category } from "@/data/catalog";
import { sendQuoteRequestAction } from "@/lib/contact-actions";

export function QuoteForm({ categories }: { categories: Category[] }) {
  const [result, formAction, pending] = useActionState(sendQuoteRequestAction, null);

  if (result === "ok") {
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-foreground">
        Pedido recebido. A nossa equipa entra em contacto brevemente.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input name="name" required placeholder="Nome" className="input-field w-full" />
      <input name="email" required type="email" placeholder="Email" className="input-field w-full" />
      <input name="phone" required type="tel" placeholder="Telemóvel" className="input-field w-full" />
      <select name="category" required className="input-field w-full" defaultValue="">
        <option value="" disabled>
          Categoria de interesse
        </option>
        {categories.map((c) => (
          <option key={c.slug} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <textarea name="body" required placeholder="Descreva o que precisa" rows={5} className="input-field w-full resize-none" />
      {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "A enviar..." : "Pedir orçamento"}
      </button>
    </form>
  );
}
