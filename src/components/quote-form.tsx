"use client";

import { useState } from "react";
import type { Category } from "@/data/catalog";

export function QuoteForm({ categories }: { categories: Category[] }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-foreground">
        Pedido recebido. A nossa equipa entra em contacto brevemente.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="mt-8 space-y-4"
    >
      <input required placeholder="Nome" className="input-field w-full" />
      <input required type="email" placeholder="Email" className="input-field w-full" />
      <input required type="tel" placeholder="Telemóvel" className="input-field w-full" />
      <select required className="input-field w-full" defaultValue="">
        <option value="" disabled>
          Categoria de interesse
        </option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <textarea required placeholder="Descreva o que precisa" rows={5} className="input-field w-full resize-none" />
      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Pedir orçamento
      </button>
    </form>
  );
}
