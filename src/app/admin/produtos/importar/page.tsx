import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { ImportProductsView } from "@/components/admin/import-products-view";

export const metadata = { title: "Importar produtos — Backoffice" };

export default async function ImportProductsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Importar produtos</h1>
      <ImportProductsView />
    </div>
  );
}
