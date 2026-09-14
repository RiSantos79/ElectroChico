import { redirect } from "next/navigation";
import { getMfaStatus } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { MfaSettings } from "@/components/admin/mfa-settings";

export const metadata = { title: "Segurança — Backoffice" };

export default async function AdminSecurityPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { enabled } = await getMfaStatus(token);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Segurança</h1>
      <MfaSettings initiallyEnabled={enabled} />
    </div>
  );
}
