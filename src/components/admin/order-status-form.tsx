"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/api";
import { updateOrderAction } from "@/lib/admin-actions";
import { ConfirmDialog } from "./confirm-dialog";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Paga" },
  { value: "PROCESSING", label: "A preparar" },
  { value: "SHIPPED", label: "Enviada" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "REFUNDED", label: "Reembolsada" },
  { value: "FAILED", label: "Falhada" },
];

export function OrderStatusForm({
  id,
  status,
  trackingCarrier,
  trackingCode,
}: {
  id: string;
  status: OrderStatus;
  trackingCarrier: string;
  trackingCode: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirming(true);
  }

  async function confirmed() {
    if (!formRef.current) return;
    setBusy(true);
    const result = await updateOrderAction(id, new FormData(formRef.current));
    setBusy(false);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/encomendas");
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Estado
          <select name="status" defaultValue={status} className="input-field">
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Transportadora
            <input name="trackingCarrier" defaultValue={trackingCarrier} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Código de rastreio
            <input name="trackingCode" defaultValue={trackingCode} className="input-field" />
          </label>
        </div>
        <p className="text-xs text-muted">
          Cancelar ou reembolsar uma encomenda já paga devolve automaticamente o stock reservado dos artigos.
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Guardar
        </button>
      </form>

      {confirming && (
        <ConfirmDialog
          message="Guardar as alterações a esta encomenda?"
          confirmLabel="Guardar"
          pending={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={confirmed}
        />
      )}
    </>
  );
}
