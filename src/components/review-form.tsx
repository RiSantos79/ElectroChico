"use client";

import { useActionState } from "react";
import { submitReviewAction } from "@/lib/review-actions";

export function ReviewForm({ productId, productSlug }: { productId: string; productSlug: string }) {
  const action = submitReviewAction.bind(null, productId, productSlug);
  const [state, formAction, pending] = useActionState(action, null);

  if (state === "done") {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
        Obrigado pela tua avaliação!
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="authorName" required placeholder="O teu nome" className="input-field" />
        <select name="rating" required defaultValue="" className="input-field">
          <option value="" disabled>
            Classificação
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </div>
      <textarea name="comment" rows={3} placeholder="Comentário (opcional)" className="input-field w-full resize-none" />
      {state && <p className="text-sm text-danger">{state}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "A enviar..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
