"use client";

import { formatPrice } from "@/lib/format";

const THUMB_CLASSES =
  "pointer-events-none absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-background " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full " +
  "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-none";

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [low, high] = value;
  const span = Math.max(1, max - min);
  const lowPct = ((low - min) / span) * 100;
  const highPct = ((high - min) / span) * 100;

  if (min >= max) return null;

  return (
    <div>
      <div className="relative h-4">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={low}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
          className={THUMB_CLASSES}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={high}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
          className={THUMB_CLASSES}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{formatPrice(low)}</span>
        <span>{formatPrice(high)}</span>
      </div>
    </div>
  );
}
