"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "electrochico:cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // ponytail: localStorage indisponível (ex. modo privado) — não mostra o aviso
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ver nota acima
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted">
          Usamos armazenamento local do teu browser só para guardar o tema, o carrinho e os favoritos —
          nada disto é partilhado nem usado para publicidade. Consulta a nossa{" "}
          <a href="/privacidade" className="underline hover:text-foreground">
            política de privacidade
          </a>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
