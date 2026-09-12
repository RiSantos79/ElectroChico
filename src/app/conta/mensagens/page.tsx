import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyContactMessages } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { ContactThread } from "@/components/contact-thread";

export const metadata = { title: "Mensagens — ElectroChico" };

export default async function AccountMessagesPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const messages = await getMyContactMessages("MESSAGE", token).catch(() => null);
  if (messages === null) return <AccountAuthForm />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Mensagens</h1>
      <ContactThread type="MESSAGE" formTitle="Enviar mensagem" historyTitle="Histórico" messages={messages} />
    </div>
  );
}
