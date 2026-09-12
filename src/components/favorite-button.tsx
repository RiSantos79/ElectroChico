"use client";

import { useFavorites } from "@/lib/favorites-context";

export function FavoriteButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { toggle, isFavorite } = useFavorites();
  const favorite = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={favorite}
      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`flex shrink-0 items-center justify-center rounded-full border text-lg ${
        favorite ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
      } ${className}`}
    >
      {favorite ? "♥" : "♡"}
    </button>
  );
}
