"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { lookupGiftCardAction, redeemGiftCardAction } from "@/lib/admin-gift-card-actions";
import type { GiftCard } from "@/lib/api";

export function GiftCardLookup() {
  const [code, setCode] = useState("");
  const [giftCard, setGiftCard] = useState<GiftCard | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await lookupGiftCardAction(code.trim());
      setGiftCard(result);
    });
  }

  function handleRedeem() {
    if (!giftCard) return;
    setError(null);
    startTransition(async () => {
      const result = await redeemGiftCardAction(giftCard.code);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setGiftCard(result);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Consultar / resgatar cartão presente</h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código do cartão (ex. EC-XXXX-XXXX)"
          className="input-field w-full flex-1 font-mono uppercase"
        />
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          Procurar
        </button>
      </form>

      {giftCard === null && <p className="mt-4 text-sm text-danger">Código não encontrado.</p>}

      {giftCard && (
        <div className="mt-4 rounded-lg border border-border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-base font-semibold text-foreground">{giftCard.code}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                giftCard.status === "ACTIVE" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
              }`}
            >
              {giftCard.status === "ACTIVE" ? "Ativo" : "Já utilizado"}
            </span>
          </div>
          <p className="mt-2 text-muted">Valor: {formatPrice(Number(giftCard.value))}</p>
          <p className="text-muted">Comprado por: {giftCard.buyerEmail}</p>
          {giftCard.recipientEmail && <p className="text-muted">Para: {giftCard.recipientEmail}</p>}
          {giftCard.status === "REDEEMED" && (
            <p className="mt-1 text-xs text-muted">
              Utilizado em {giftCard.redeemedAt ? new Date(giftCard.redeemedAt).toLocaleString("pt-PT") : ""}
              {giftCard.redeemedBy ? ` por ${giftCard.redeemedBy}` : ""}
            </p>
          )}

          {error && <p className="mt-2 text-sm text-danger">{error}</p>}

          {giftCard.status === "ACTIVE" && (
            <button
              type="button"
              onClick={handleRedeem}
              disabled={isPending}
              className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              Marcar como utilizado
            </button>
          )}
        </div>
      )}
    </div>
  );
}
