import { getOrdersAdmin, type Order } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  PROCESSING: "A preparar",
  SHIPPED: "Enviada",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
  FAILED: "Falhada",
};

export async function GET() {
  const token = await getSessionToken();
  if (!token) return new Response("Não autenticado", { status: 401 });

  const orders = await getOrdersAdmin(token);
  const csv = toCsv<Order>(orders, [
    { label: "ID", value: (o) => o.id },
    { label: "Data", value: (o) => new Date(o.createdAt).toLocaleString("pt-PT") },
    { label: "Cliente", value: (o) => o.customerName },
    { label: "Email", value: (o) => o.customerEmail },
    { label: "Estado", value: (o) => statusLabel[o.status] ?? o.status },
    { label: "Artigos", value: (o) => o.items.map((i) => `${i.productName} x${i.quantity}`).join("; ") },
    { label: "Subtotal", value: (o) => (o.subtotal ? Number(o.subtotal) : "") },
    { label: "Desconto", value: (o) => (o.discountAmount ? Number(o.discountAmount) : "") },
    { label: "Cupão", value: (o) => o.couponCode ?? "" },
    { label: "Total", value: (o) => Number(o.total) },
    { label: "Transportadora", value: (o) => o.trackingCarrier ?? "" },
    { label: "Código de Rastreio", value: (o) => o.trackingCode ?? "" },
  ]);

  return csvResponse(csv, `encomendas-${new Date().toISOString().slice(0, 10)}.csv`);
}
