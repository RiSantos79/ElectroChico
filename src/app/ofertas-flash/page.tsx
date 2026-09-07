import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/api";

export const metadata = { title: "Ofertas Flash — ElectroChico" };

export default async function FlashDealsPage() {
  const products = await getProducts();
  return <CatalogView title="Ofertas Flash" products={products.filter((p) => p.badge === "promo")} />;
}
