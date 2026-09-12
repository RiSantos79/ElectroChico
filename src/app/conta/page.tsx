import { decodeJwt } from "jose";
import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyAddresses } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountProfile } from "@/components/account-profile";
import { AccountAddresses } from "@/components/account-addresses";

export const metadata = { title: "A minha conta — ElectroChico" };

export default async function AccountPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const addresses = await getMyAddresses(token).catch(() => null);
  if (addresses === null) return <AccountAuthForm />;

  const { name, email } = decodeJwt<{ name?: string | null; email: string }>(token);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">A minha conta</h1>
      <AccountProfile name={name} email={email} />
      <AccountAddresses addresses={addresses} />
    </div>
  );
}
