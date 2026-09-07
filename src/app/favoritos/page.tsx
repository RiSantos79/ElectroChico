import { FavoritesView } from "@/components/favorites-view";
import { getProducts } from "@/lib/api";

export default async function FavoritesPage() {
  const products = await getProducts();
  return <FavoritesView products={products} />;
}
