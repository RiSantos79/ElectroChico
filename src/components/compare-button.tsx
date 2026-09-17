"use client";

import { MAX_COMPARE, useComparison } from "@/lib/comparison-context";

export function CompareButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { toggle, isComparing, slugs } = useComparison();
  const comparing = isComparing(slug);
  const disabled = !comparing && slugs.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={disabled}
      aria-pressed={comparing}
      aria-label={comparing ? "Remover da comparação" : "Adicionar à comparação"}
      title={disabled ? `Só é possível comparar até ${MAX_COMPARE} produtos` : undefined}
      className={`flex shrink-0 items-center justify-center rounded-full border text-lg disabled:cursor-not-allowed disabled:opacity-40 ${
        comparing ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <path d="M4 6h6M4 12h10M4 18h6" strokeLinecap="round" />
        <path d="M17 6l3 3-3 3M20 9h-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
