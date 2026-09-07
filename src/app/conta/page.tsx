"use client";

import { useState } from "react";

export default function AccountPage() {
  const [tab, setTab] = useState<"entrar" | "criar">("entrar");

  return (
    <div className="mx-auto max-w-md px-6 py-12 lg:px-10">
      <div className="mb-6 flex rounded-full border border-border p-1">
        {(["entrar", "criar"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              tab === t ? "bg-accent text-accent-foreground" : "text-muted"
            }`}
          >
            {t === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {tab === "criar" && <input placeholder="Nome completo" className="input-field w-full" />}
        <input type="email" placeholder="Email" className="input-field w-full" />
        <input type="password" placeholder="Palavra-passe" className="input-field w-full" />
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          {tab === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Contas de cliente ainda não estão ligadas a um backend — esta é a pré-visualização da interface.
      </p>
    </div>
  );
}
