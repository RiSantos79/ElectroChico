"use client";

import { useState } from "react";
import type { Order } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const IVA_RATE = 0.23;

function splitIva(totalWithIva: number) {
  const semIva = totalWithIva / (1 + IVA_RATE);
  return { semIva, iva: totalWithIva - semIva };
}

export function AccountInvoices({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<Order | null>(null);

  if (orders.length === 0) {
    return <p className="text-sm text-muted">Ainda não há faturas — só encomendas pagas geram fatura.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Nº Encomenda</th>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-xs text-muted">{order.id.slice(0, 10)}</td>
              <td className="px-4 py-3 text-muted">{new Date(order.createdAt).toLocaleDateString("pt-PT")}</td>
              <td className="px-4 py-3 font-medium text-foreground">{formatPrice(Number(order.total))}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => setSelected(order)}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Ver fatura
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface-raised p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-foreground">Fatura — {selected.id.slice(0, 10)}</h3>
              <button type="button" onClick={() => setSelected(null)} aria-label="Fechar" className="text-muted hover:text-foreground">
                ✕
              </button>
            </div>
            <p className="text-sm text-muted">Cliente: {selected.customerName}</p>
            <p className="mb-4 text-sm text-muted">
              Data: {new Date(selected.createdAt).toLocaleDateString("pt-PT")}
            </p>
            <table className="w-full text-sm">
              <thead className="text-muted">
                <tr className="border-b border-border">
                  <th className="py-1 text-left font-medium">Artigo</th>
                  <th className="py-1 text-right font-medium">Qtd</th>
                  <th className="py-1 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {selected.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-foreground">{item.productName}</td>
                    <td className="py-2 text-right text-muted">{item.quantity}</td>
                    <td className="py-2 text-right text-foreground">
                      {formatPrice(Number(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(() => {
              const { semIva, iva } = splitIva(Number(selected.total));
              return (
                <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Base incidência</span>
                    <span>{formatPrice(semIva)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>IVA (23%)</span>
                    <span>{formatPrice(iva)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Portes</span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(Number(selected.total))}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
