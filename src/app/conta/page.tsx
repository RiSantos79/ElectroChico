import { decodeJwt } from "jose";
import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyOrders } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountOrders } from "@/components/account-orders";

export const metadata = { title: "A minha conta — ElectroChico" };

export default async function AccountPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const orders = await getMyOrders(token).catch(() => null);
  if (orders === null) return <AccountAuthForm />;

  const { name } = decodeJwt<{ name?: string | null }>(token);
  return <AccountOrders name={name} orders={orders} />;
}
