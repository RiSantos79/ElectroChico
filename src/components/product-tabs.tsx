"use client";

import { useState } from "react";

export function ProductTabs({
  description,
  specs,
}: {
  description: string;
  specs: { label: string; value: string }[];
}) {
  const [tab, setTab] = useState<"descricao" | "specs">("descricao");

  return (
    <section className="mt-14 max-w-2xl">
      <div className="mb-4 flex gap-2 border-b border-border">
        {(
          [
            ["descricao", "Descrição"],
            ["specs", "Especificações técnicas"],
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

      {tab === "descricao" ? (
        <div
          className="prose-sm max-w-none text-sm leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_em]:italic [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : (
        <dl className="divide-y divide-border rounded-xl border border-border">
          {specs.map((spec) => (
            <div key={spec.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted">{spec.label}</dt>
              <dd className="font-medium text-foreground">{spec.value}</dd>
            </div>
          ))}
          {specs.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">Sem especificações.</p>}
        </dl>
      )}
    </section>
  );
}
