import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/api";

export const metadata = { title: "Catálogo — ElectroChico" };

export default async function CatalogPage() {
  const products = await getProducts();
  return <CatalogView title="Todos os produtos" products={products} />;
}
