import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyOrders } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountOrders } from "@/components/account-orders";

export const metadata = { title: "As minhas encomendas — ElectroChico" };

export default async function AccountOrdersPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const orders = await getMyOrders(token).catch(() => null);
  if (orders === null) return <AccountAuthForm />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <AccountOrders orders={orders} />
    </div>
  );
}
