import { getProducts } from "@/lib/api";
import type { Product } from "@/data/catalog";
import { getSessionToken } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return new Response("Não autenticado", { status: 401 });

  const products = await getProducts({ includeArchived: true });
  const csv = toCsv<Product>(products, [
    { label: "Nome", value: (p) => p.name },
    { label: "Marca", value: (p) => p.brand },
    { label: "Categoria", value: (p) => p.category },
    { label: "SKU", value: (p) => p.sku ?? "" },
    { label: "EAN", value: (p) => p.ean ?? "" },
    { label: "Preço", value: (p) => p.price },
    { label: "Preço Antigo", value: (p) => p.oldPrice ?? "" },
    { label: "Stock", value: (p) => p.stockQuantity },
    { label: "Arquivado", value: (p) => (p.archived ? "Sim" : "Não") },
  ]);

  return csvResponse(csv, `produtos-${new Date().toISOString().slice(0, 10)}.csv`);
}
