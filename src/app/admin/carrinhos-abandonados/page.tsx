import { redirect } from "next/navigation";
import { getAbandonedCarts } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { sendReminderAction } from "@/lib/admin-actions";

export const metadata = { title: "Carrinhos Abandonados — Backoffice" };

function timeSince(dateStr: string): string {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default async function AbandonedCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { resultado } = await searchParams;
  const carts = await getAbandonedCarts(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Carrinhos Abandonados ({carts.length})</h1>
      <p className="mb-6 text-sm text-muted">Encomendas pendentes há mais de 1 hora sem pagamento.</p>

      {resultado === "enviado" && (
        <p className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          Lembrete enviado.
        </p>
      )}
      {resultado === "nao-configurado" && (
        <p className="mb-4 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted">
          O envio de email ainda não está configurado — contacte o cliente diretamente pelos dados abaixo.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Há</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Artigos</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Contactado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {carts.map((cart) => (
              <tr key={cart.id}>
                <td className="px-4 py-3 text-muted">{timeSince(cart.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{cart.customerName}</div>
                  <div className="text-xs text-muted">
                    {cart.customerEmail}
                    {cart.customerPhone ? ` · ${cart.customerPhone}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {cart.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{formatPrice(Number(cart.total))}</td>
                <td className="px-4 py-3 text-muted">
                  {cart.reminderSentAt
                    ? `Sim, há ${timeSince(cart.reminderSentAt)}`
                    : "Não"}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={sendReminderAction.bind(null, cart.id)}>
                    <button type="submit" className="font-medium text-accent hover:underline">
                      Enviar lembrete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {carts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Sem carrinhos abandonados de momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
