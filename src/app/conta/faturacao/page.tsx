import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyOrders } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountInvoices } from "@/components/account-invoices";

export const metadata = { title: "Facturação — ElectroChico" };

export default async function AccountInvoicesPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const orders = await getMyOrders(token).catch(() => null);
  if (orders === null) return <AccountAuthForm />;

  const paidOrders = orders.filter((o) => o.status === "PAID");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Facturação</h1>
      <AccountInvoices orders={paidOrders} />
    </div>
  );
}
