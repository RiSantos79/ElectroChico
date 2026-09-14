import { redirect } from "next/navigation";
import { getCouponsAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "@/lib/admin-actions";

export const metadata = { title: "Cupões — Backoffice" };

function formatDiscount(coupon: { type: string; value: string }) {
  return coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : formatPrice(Number(coupon.value));
}

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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
              <th className="px-4 py-3 font-medium">Compra mínima</th>
              <th className="px-4 py-3 font-medium">Utilizações</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-4 py-3 font-mono font-medium text-foreground">{coupon.code}</td>
                <td className="px-4 py-3 text-muted">{formatDiscount(coupon)}</td>
                <td className="px-4 py-3 text-muted">
                  {coupon.minOrderValue ? formatPrice(Number(coupon.minOrderValue)) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {coupon.usesCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                </td>
                <td className="px-4 py-3 text-muted">
                  {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString("pt-PT") : "—"}
                  {" – "}
                  {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("pt-PT") : "—"}
                </td>
                <td className={`px-4 py-3 font-medium ${coupon.active ? "text-success" : "text-muted"}`}>
                  {coupon.active ? "Ativo" : "Inativo"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <form action={toggleCouponAction.bind(null, coupon.id, !coupon.active)}>
                      <button type="submit" className="font-medium text-accent hover:underline">
                        {coupon.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                    <form action={deleteCouponAction.bind(null, coupon.id)}>
                      <button type="submit" className="font-medium text-danger hover:underline">
                        Apagar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Ainda não há cupões criados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
