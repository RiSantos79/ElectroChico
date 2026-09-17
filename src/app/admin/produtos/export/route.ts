import { getProducts, logDataExport } from "@/lib/api";
import type { Product } from "@/data/catalog";
import { getSessionToken } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return new Response("Não autenticado", { status: 401 });

  const products = await getProducts({ includeArchived: true });
  await logDataExport("Product", products.length, token);
  const csv = toCsv<Product>(products, [
    { label: "ID", value: (p) => p.id },
    { label: "Nome", value: (p) => p.name },
    { label: "Marca (slug)", value: (p) => p.brandSlug },
    { label: "Categoria (slug)", value: (p) => p.category },
    { label: "SKU", value: (p) => p.sku ?? "" },
    { label: "EAN", value: (p) => p.ean ?? "" },
    { label: "Preço", value: (p) => p.price },
    { label: "Preço Antigo", value: (p) => p.oldPrice ?? "" },
    { label: "Stock", value: (p) => p.stockQuantity },
    { label: "Classe Energética", value: (p) => p.energyClass },
    { label: "Arquivado", value: (p) => (p.archived ? "Sim" : "Não") },
  ]);

  return csvResponse(csv, `produtos-${new Date().toISOString().slice(0, 10)}.csv`);
}
