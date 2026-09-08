export type StockTier = "out" | "low" | "medium" | "high";

export function getStockTier(quantity: number): StockTier {
  if (quantity <= 0) return "out";
  if (quantity < 5) return "low";
  if (quantity <= 10) return "medium";
  return "high";
}

export const stockTierStyle: Record<StockTier, { bar: string; text: string; label: string }> = {
  out: { bar: "bg-border", text: "text-muted", label: "Esgotado" },
  low: { bar: "bg-danger", text: "text-danger", label: "Últimas unidades" },
  medium: { bar: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400", label: "Stock limitado" },
  high: { bar: "bg-success", text: "text-success", label: "Em stock" },
};

// ponytail: escala visual arbitrária — 20 unidades enche a barra a 100%.
// Ajustar aqui se um valor de referência diferente fizer mais sentido no negócio.
const REFERENCE_MAX_STOCK = 20;

export function getStockFillPercent(quantity: number): number {
  if (quantity <= 0) return 0;
  return Math.max(8, Math.min(100, Math.round((quantity / REFERENCE_MAX_STOCK) * 100)));
}
