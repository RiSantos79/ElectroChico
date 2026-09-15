"use client";

import { useState } from "react";

// Mesma lógica do slugify usado no backend (api/src/common/slugify.ts) —
// mantém os slugs gerados no formulário consistentes com os que a API geraria.
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NameSlugFields({ defaultName, defaultSlug }: { defaultName?: string; defaultSlug?: string }) {
  const [slug, setSlug] = useState(defaultSlug ?? "");
  // Um slug já existente (produto em edição) nunca deve ser reescrito só
  // porque o nome mudou — só produtos novos, ainda sem slug definido,
  // recebem o preenchimento automático.
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultSlug));

  return (
    <>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Nome
        <input
          name="name"
          required
          defaultValue={defaultName}
          onChange={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="input-field"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        Slug (URL)
        <input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="input-field"
        />
      </label>
    </>
  );
}
