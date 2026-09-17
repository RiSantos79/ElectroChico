import { ComparisonView } from "@/components/comparison-view";
import { getProducts } from "@/lib/api";

export const metadata = { title: "Comparar produtos — ElectroChico" };

export default async function ComparisonPage() {
  const products = await getProducts();
  return <ComparisonView products={products} />;
}
