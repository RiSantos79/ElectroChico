"use client";

import { useMemo, useState } from "react";
import type { Brand, BulkPriceChangeMode } from "@/lib/api";
import type { Category, Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { bulkPriceChangeAction } from "@/lib/admin-actions";
import { ReauthModal } from "./reauth-modal";
import { MultiSelectDropdown } from "./multi-select-dropdown";

const REAUTH_THRESHOLD_PERCENT = 20;

type Scope = "selected" | "category" | "brand" | "all";

function ModeToggle({ mode, onChange }: { mode: BulkPriceChangeMode; onChange: (mode: BulkPriceChangeMode) => void }) {
  const isPercent = mode === "percent";
  return (
    <button
      type="button"
      onClick={() => onChange(isPercent ? "amount" : "percent")}
      aria-pressed={isPercent}
      aria-label="Alternar entre valor em euros e percentagem"
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
    >
      <span className={isPercent ? "text-muted" : "font-semibold text-foreground"}>€</span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-foreground/80">
        <span
          className={`inline-block size-4 rounded-full bg-background transition-transform ${
            isPercent ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className={isPercent ? "font-semibold text-foreground" : "text-muted"}>%</span>
    </button>
  );
}

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
  const [mode, setMode] = useState<BulkPriceChangeMode>("amount");
  const [valueInput, setValueInput] = useState("5");
  const [step, setStep] = useState<"form" | "preview">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthing, setReauthing] = useState(false);

  const value = Number(valueInput);
  const validValue = Number.isFinite(value) && value !== 0;

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

  function computeNewPrice(price: number) {
    const raw = mode === "percent" ? price * (1 + value / 100) : price + value;
    return Math.max(0, Math.round(raw * 100) / 100);
  }

  // Em euros, o impacto depende do preço de cada produto — a mesma regra
  // usada no backend para decidir se pede confirmação extra. Em percentagem
  // é diretamente comparável.
  const maxPercentImpact = targets.length
    ? Math.max(...targets.map((p) => (mode === "percent" ? Math.abs(value) : (Math.abs(value) / p.price) * 100)))
    : 0;
  const needsReauth = maxPercentImpact > REAUTH_THRESHOLD_PERCENT;

  async function apply(reauthToken?: string) {
    setBusy(true);
    setError(null);
    const result = await bulkPriceChangeAction(
      targets.map((p) => p.id),
      mode,
      value,
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

            <div className="flex flex-col gap-1 text-sm">
              <span>Tipo de alteração</span>
              <ModeToggle mode={mode} onChange={setMode} />
            </div>

            <label className="flex flex-col gap-1 text-sm">
              {mode === "percent" ? "Percentagem" : "Valor em euros"} (positivo para aumentar, negativo para reduzir)
              <input
                type="number"
                step={mode === "percent" ? "0.1" : "0.01"}
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                placeholder={mode === "percent" ? "ex.: 10 ou -5" : "ex.: 5 ou -5"}
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
                disabled={!validValue || targets.length === 0}
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
                    const newPrice = computeNewPrice(p.price);
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-foreground">{p.name}</td>
                        <td className="px-3 py-2 text-muted">{formatPrice(p.price)}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{formatPrice(newPrice)}</td>
                        <td className={`px-3 py-2 ${value >= 0 ? "text-success" : "text-danger"}`}>
                          {value >= 0 ? "+" : ""}
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
