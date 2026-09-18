import { CheckoutView } from "@/components/checkout-view";
import { getMyAddresses, getProducts, type Address } from "@/lib/api";
import { getCustomerSessionToken } from "@/lib/customer-session";

export default async function CheckoutPage() {
  const token = await getCustomerSessionToken();
  // Moradas guardadas só existem para quem tem sessão iniciada; convidados
  // continuam a preencher à mão e o checkout não pode falhar por causa disto.
  const [products, addresses] = await Promise.all([
    getProducts(),
    token ? getMyAddresses(token).catch((): Address[] => []) : Promise.resolve<Address[]>([]),
  ]);

  return <CheckoutView products={products} addresses={addresses} />;
}
