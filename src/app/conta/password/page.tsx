import { getCustomerSessionToken } from "@/lib/customer-session";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountPasswordForm } from "@/components/account-password-form";

export const metadata = { title: "Modificar palavra-passe — ElectroChico" };

export default async function AccountPasswordPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  return (
    <div className="mx-auto max-w-md px-6 py-12 lg:px-10">
      <AccountPasswordForm />
    </div>
  );
}
