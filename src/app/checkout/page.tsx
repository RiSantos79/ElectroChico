import { CheckoutView } from "@/components/checkout-view";
import { getProducts } from "@/lib/api";

export default async function CheckoutPage() {
  const products = await getProducts();
  return <CheckoutView products={products} />;
}
