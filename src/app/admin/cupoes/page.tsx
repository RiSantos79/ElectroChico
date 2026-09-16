import { redirect } from "next/navigation";
import { getCouponsAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { createCouponAction } from "@/lib/admin-actions";
import { CouponsTable } from "@/components/admin/coupons-table";

export const metadata = { title: "Cupões — Backoffice" };

export default async function AdminCouponsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const coupons = await getCouponsAdmin(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cupões ({coupons.length})</h1>

      <section className="mb-8 max-w-2xl rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Novo cupão</h2>
        <form action={createCouponAction} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Código
            <input name="code" required placeholder="VERAO10" className="input-field uppercase" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tipo de desconto
            <select name="type" required defaultValue="PERCENTAGE" className="input-field">
              <option value="PERCENTAGE">Percentagem (%)</option>
              <option value="FIXED">Valor fixo (€)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Valor
            <input type="number" step="0.01" min="0" name="value" required className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Compra mínima (opcional)
            <input type="number" step="0.01" min="0" name="minOrderValue" className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Limite de utilizações (opcional)
            <input type="number" min="1" name="maxUses" className="input-field" />
          </label>
          <div />
          <label className="flex flex-col gap-1 text-sm">
            Válido a partir de (opcional)
            <input type="date" name="validFrom" className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Válido até (opcional)
            <input type="date" name="validUntil" className="input-field" />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:col-span-2"
          >
            Criar cupão
          </button>
        </form>
      </section>

      <CouponsTable coupons={coupons} />
    </div>
  );
}
