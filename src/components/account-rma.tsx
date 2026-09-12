"use client";

import { useActionState } from "react";
import type { ContactMessage } from "@/lib/api";
import { sendRmaAction } from "@/lib/contact-actions";

export function AccountRma({ requests }: { requests: ContactMessage[] }) {
  const [result, formAction] = useActionState(sendRmaAction, null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Pedir devolução / RMA</h2>
        <form action={formAction} className="space-y-4">
          <input name="orderId" placeholder="Nº da encomenda (opcional)" className="input-field w-full" />
          <input required name="productName" placeholder="Artigo" className="input-field w-full" />
          <textarea
            required
            name="body"
            rows={4}
            placeholder="Descreva a avaria ou o motivo da devolução"
            className="input-field w-full resize-none"
          />
          {result && result !== "ok" && <p className="text-sm text-danger">{result}</p>}
          {result === "ok" && <p className="text-sm text-success">Pedido enviado — vamos entrar em contacto.</p>}
          <button
            type="submit"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Enviar pedido
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Os meus pedidos</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted">Ainda não fez nenhum pedido de RMA.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{r.productName || "Artigo não especificado"}</span>
                  <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("pt-PT")}</span>
                </div>
                {r.orderId && <p className="mt-1 text-xs text-muted">Encomenda: {r.orderId}</p>}
                <p className="mt-1 text-muted">{r.body}</p>
                <span className="mt-1 inline-block text-xs font-medium text-accent">{r.status}</span>
                {r.reply && (
                  <div className="mt-3 rounded-lg border border-border bg-surface p-3">
                    <div className="mb-1 text-xs font-medium text-success">Resposta da loja</div>
                    <p className="text-foreground">{r.reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
