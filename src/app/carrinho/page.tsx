import { CartView } from "@/components/cart-view";
import { getProducts } from "@/lib/api";

export default async function CartPage() {
  const products = await getProducts();
  return <CartView products={products} />;
}
