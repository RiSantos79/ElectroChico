import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/api";

export const metadata = { title: "Catálogo — ElectroChico" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts();
  return <CatalogView title="Todos os produtos" products={products} initialQuery={q} />;
}
