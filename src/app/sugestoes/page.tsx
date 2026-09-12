import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyContactMessages } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { ContactThread } from "@/components/contact-thread";

export const metadata = { title: "Sugestões — ElectroChico" };

export default async function SuggestionsPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const suggestions = await getMyContactMessages("SUGGESTION", token).catch(() => null);
  if (suggestions === null) return <AccountAuthForm />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Sugestões</h1>
      <ContactThread
        type="SUGGESTION"
        formTitle="Enviar sugestão"
        historyTitle="As minhas sugestões"
        messages={suggestions}
      />
    </div>
  );
}
