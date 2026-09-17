"use client";

import { useMemo, useState } from "react";
import type { Brand } from "@/lib/api";
import type { Category, Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { bulkPriceChangeAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";
import { MultiSelectDropdown } from "./multi-select-dropdown";

const REAUTH_THRESHOLD_PERCENT = 20;

type Scope = "selected" | "category" | "brand" | "all";

export function BulkPriceChangeModal({
  products,
  categories,
  brands,
  selectedIds,
  onClose,
}: {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  selectedIds: string[];
  onClose: () => void;
}) {
  const [scope, setScope] = useState<Scope>(selectedIds.length > 0 ? "selected" : "category");
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [brandSlugs, setBrandSlugs] = useState<string[]>([]);
  const [amountInput, setAmountInput] = useState("5");
  const [step, setStep] = useState<"form" | "preview">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthing, setReauthing] = useState(false);

  const amount = Number(amountInput);
  const validAmount = Number.isFinite(amount) && amount !== 0;

  const targets = useMemo(() => {
    switch (scope) {
      case "selected":
        return products.filter((p) => selectedIds.includes(p.id));
      case "category":
        return products.filter((p) => categorySlugs.includes(p.category));
      case "brand":
        return products.filter((p) => brandSlugs.includes(p.brandSlug));
      case "all":
        return products;
    }
  }, [scope, categorySlugs, brandSlugs, products, selectedIds]);

  // Um valor fixo pesa de forma diferente consoante o preço de cada produto
  // — a mesma regra usada no backend para decidir se pede confirmação extra.
  const maxPercentImpact = targets.length
    ? Math.max(...targets.map((p) => (Math.abs(amount) / p.price) * 100))
    : 0;
  const needsReauth = maxPercentImpact > REAUTH_THRESHOLD_PERCENT;

  async function apply(reauthToken?: string) {
    setBusy(true);
    setError(null);
    const result = await bulkPriceChangeAction(
      targets.map((p) => p.id),
      amount,
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
    if (needsReauth) {
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
                  <MultiSelectDropdown
                    options={categories.map((c) => ({ value: c.slug, label: c.name }))}
                    selected={categorySlugs}
                    onChange={setCategorySlugs}
                    placeholder="Escolher categorias"
                  />
                </label>
              )}
              {scope === "brand" && (
                <label className="flex flex-col gap-1 text-sm">
                  Marca
                  <MultiSelectDropdown
                    options={brands.map((b) => ({ value: b.slug, label: b.name }))}
                    selected={brandSlugs}
                    onChange={setBrandSlugs}
                    placeholder="Escolher marcas"
                  />
                </label>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              Valor em euros (positivo para aumentar, negativo para reduzir)
              <input
                type="number"
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="ex.: 5 ou -5"
                className="input-field"
              />
            </label>

            <p className="text-xs text-muted">
              {targets.length} produto(s) serão afetados.
              {needsReauth && " Esta alteração exige confirmação adicional para pelo menos um dos produtos."}
            </p>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="text-sm font-medium text-muted hover:text-foreground">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!validAmount || targets.length === 0}
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
                    const newPrice = Math.max(0, Math.round((p.price + amount) * 100) / 100);
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-muted">{formatPrice(p.price)}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{formatPrice(newPrice)}</td>
                        <td className={`px-3 py-2 ${amount >= 0 ? "text-success" : "text-danger"}`}>
                          {amount >= 0 ? "+" : ""}
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
          message="Este valor representa mais de 20% do preço de pelo menos um produto — requer confirmação adicional."
          onCancel={() => setReauthing(false)}
          onConfirmed={(reauthToken) => apply(reauthToken)}
        />
      )}
    </div>
  );
}
