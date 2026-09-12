import { decodeJwt } from "jose";
import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyOrders, getMyAddresses } from "@/lib/api";
import { customerLogoutAction } from "@/lib/customer-auth-actions";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountProfile } from "@/components/account-profile";
import { AccountAddresses } from "@/components/account-addresses";
import { AccountOrders } from "@/components/account-orders";

export const metadata = { title: "A minha conta — ElectroChico" };

export default async function AccountPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const [orders, addresses] = await Promise.all([
    getMyOrders(token).catch(() => null),
    getMyAddresses(token).catch(() => null),
  ]);
  if (orders === null || addresses === null) return <AccountAuthForm />;

  const { name, email } = decodeJwt<{ name?: string | null; email: string }>(token);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{name ? `Olá, ${name}` : "A minha conta"}</h1>
        <form action={customerLogoutAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Sair
          </button>
        </form>
      </div>

      <AccountProfile name={name} email={email} />
      <AccountAddresses addresses={addresses} />
      <AccountOrders orders={orders} />
    </div>
  );
}
