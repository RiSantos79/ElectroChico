import { getStockFillPercent, getStockTier, stockTierStyle } from "@/lib/stock";

export function StockBar({
  quantity,
  compact = false,
  className = "",
}: {
  quantity: number;
  compact?: boolean;
  className?: string;
}) {
  const tier = getStockTier(quantity);
  const style = stockTierStyle[tier];
  const fillPercent = getStockFillPercent(quantity);
  const tooltipText = tier === "out" ? "Esgotado" : `${quantity} em stock`;

  return (
    <div className={className}>
      <div className={`group relative w-full ${compact ? "h-4" : "h-5"}`}>
        <div className="h-full w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full transition-[width] ${style.bar}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-semibold text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          {tooltipText}
        </div>
      </div>
      {!compact && <p className={`mt-1 text-xs font-medium ${style.text}`}>{style.label}</p>}
    </div>
  );
}
