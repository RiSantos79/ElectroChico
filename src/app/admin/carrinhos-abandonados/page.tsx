import { redirect } from "next/navigation";
import { getAbandonedCarts } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { AbandonedCartsTable } from "@/components/admin/abandoned-carts-table";

export const metadata = { title: "Carrinhos Abandonados — Backoffice" };

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

      <AbandonedCartsTable carts={carts} />
    </div>
  );
}
