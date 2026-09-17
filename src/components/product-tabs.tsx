"use client";

import { useState } from "react";
import type { Review } from "@/lib/api";
import { ReviewForm } from "@/components/review-form";

export function ProductTabs({
  description,
  specs,
  faqs,
  reviews,
  productId,
  productSlug,
}: {
  description: string;
  specs: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  reviews: Review[];
  productId: string;
  productSlug: string;
}) {
  const [tab, setTab] = useState<"descricao" | "specs" | "faq" | "avaliacoes">("descricao");

  return (
    <section className="mt-14 max-w-2xl">
      <div className="mb-4 flex gap-2 border-b border-border">
        {(
          [
            ["descricao", "Descrição"],
            ["specs", "Especificações técnicas"],
            ...(faqs.length > 0 ? [["faq", "Perguntas frequentes"] as const] : []),
            ["avaliacoes", `Avaliações (${reviews.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium ${
              tab === value ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "descricao" && (
        <div
          className="prose-sm max-w-none text-sm leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_em]:italic [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {tab === "specs" &&
        (specs.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border text-sm">
            <div className="grid bg-surface" style={{ gridTemplateColumns: "180px 1fr" }}>
              <div className="px-4 py-3 font-semibold text-foreground">Especificação</div>
              <div className="px-4 py-3 font-semibold text-foreground">Detalhe</div>
            </div>
            {specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`grid ${i % 2 === 1 ? "bg-surface/60" : ""}`}
                style={{ gridTemplateColumns: "180px 1fr" }}
              >
                <div className="px-4 py-3 font-medium text-foreground">{spec.label}</div>
                <div className="px-4 py-3 text-muted">{spec.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Sem especificações.</p>
        ))}

      {tab === "faq" && (
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details key={i} className="rounded-xl border border-border bg-surface-raised p-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground">{faq.question}</summary>
              <p className="mt-2 text-sm text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      )}

      {tab === "avaliacoes" && (
        <div>
          {reviews.length > 0 ? (
            <ul className="mb-6 space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{r.authorName}</span>
                    <span className="text-sm text-muted">{"★".repeat(r.rating)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-6 text-sm text-muted">Ainda não há avaliações — sê o primeiro a deixar uma.</p>
          )}
          <ReviewForm productId={productId} productSlug={productSlug} />
        </div>
      )}
    </section>
  );
}
