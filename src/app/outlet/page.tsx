import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/api";

export const metadata = { title: "Outlet — ElectroChico" };

export default async function OutletPage() {
  const products = await getProducts();
  return <CatalogView title="Outlet" products={products.filter((p) => p.oldPrice)} />;
}
