"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { bulkPriceChangeAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";

const REAUTH_THRESHOLD_PERCENT = 20;

type Scope = "selected" | "category" | "brand" | "all";

export function BulkPriceChangeModal({
  products,
  selectedIds,
  onClose,
}: {
  products: Product[];
  selectedIds: string[];
  onClose: () => void;
}) {
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);

  const [scope, setScope] = useState<Scope>(selectedIds.length > 0 ? "selected" : "category");
  const [scopeValue, setScopeValue] = useState(categories[0] ?? "");
  const [percentInput, setPercentInput] = useState("10");
  const [step, setStep] = useState<"form" | "preview">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthing, setReauthing] = useState(false);

  const percent = Number(percentInput);
  const validPercent = Number.isFinite(percent) && percent !== 0 && percent >= -90 && percent <= 1000;

  const targets = useMemo(() => {
    switch (scope) {
      case "selected":
        return products.filter((p) => selectedIds.includes(p.id));
      case "category":
        return products.filter((p) => p.category === scopeValue);
      case "brand":
        return products.filter((p) => p.brand === scopeValue);
      case "all":
        return products;
    }
  }, [scope, scopeValue, products, selectedIds]);

  async function apply(reauthToken?: string) {
    setBusy(true);
    setError(null);
    const result = await bulkPriceChangeAction(
      targets.map((p) => p.id),
      percent,
      reauthToken,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setReauthing(false);
      return;
    }
    onClose();
  }

  function handleApplyClick() {
    if (Math.abs(percent) > REAUTH_THRESHOLD_PERCENT) {
      setReauthing(true);
      return;
    }
    void apply();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-surface-raised p-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">Alteração de preços em massa</h3>

        {step === "form" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Aplicar a
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as Scope)}
                  className="input-field"
                >
                  {selectedIds.length > 0 && <option value="selected">Produtos selecionados ({selectedIds.length})</option>}
                  <option value="category">Uma categoria</option>
                  <option value="brand">Uma marca</option>
                  <option value="all">Catálogo completo ({products.length})</option>
                </select>
              </label>
              {scope === "category" && (
                <label className="flex flex-col gap-1 text-sm">
                  Categoria
                  <select value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} className="input-field">
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {scope === "brand" && (
                <label className="flex flex-col gap-1 text-sm">
                  Marca
                  <select value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} className="input-field">
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              Percentagem (positiva para aumentar, negativa para reduzir)
              <input
                type="number"
                step="0.1"
                value={percentInput}
                onChange={(e) => setPercentInput(e.target.value)}
                placeholder="ex.: 10 ou -5"
                className="input-field"
              />
            </label>

            <p className="text-xs text-muted">
              {targets.length} produto(s) serão afetados.
              {Math.abs(percent) > REAUTH_THRESHOLD_PERCENT &&
                " Alterações superiores a 20% exigem confirmação adicional."}
            </p>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="text-sm font-medium text-muted hover:text-foreground">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!validPercent || targets.length === 0}
                onClick={() => setStep("preview")}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                Pré-visualizar
              </button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Produto</th>
                    <th className="px-3 py-2 font-medium">Preço atual</th>
                    <th className="px-3 py-2 font-medium">Novo preço</th>
                    <th className="px-3 py-2 font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {targets.map((p) => {
                    const newPrice = Math.round(p.price * (1 + percent / 100) * 100) / 100;
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-muted">{formatPrice(p.price)}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{formatPrice(newPrice)}</td>
                        <td className={`px-3 py-2 ${percent >= 0 ? "text-success" : "text-danger"}`}>
                          {percent >= 0 ? "+" : ""}
                          {formatPrice(newPrice - p.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-sm font-medium text-muted hover:text-foreground"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleApplyClick}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "A aplicar..." : `Aplicar a ${targets.length} produto(s)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {reauthing && (
        <ReauthModal
          message="Alterações de preço superiores a 20% requerem confirmação adicional."
          onCancel={() => setReauthing(false)}
          onConfirmed={(reauthToken) => apply(reauthToken)}
        />
      )}
    </div>
  );
}
