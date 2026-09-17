import { ProductForm } from "@/components/admin/product-form";
import { getAiStatus, getBrandsAdmin, getCategoriesAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { createProductAction } from "@/lib/admin-actions";

export const metadata = { title: "Novo produto — Backoffice" };

export default async function NewProductPage() {
  const token = await getSessionToken();
  const [categories, brands, ai] = await Promise.all([
    getCategoriesAdmin(),
    getBrandsAdmin(),
    // Se a IA estiver desligada (ou a chamada falhar) os botões simplesmente
    // não aparecem — o formulário funciona na mesma.
    token ? getAiStatus(token).catch(() => ({ enabled: false })) : Promise.resolve({ enabled: false }),
  ]);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Novo produto</h1>
      <ProductForm categories={categories} brands={brands} action={createProductAction} aiEnabled={ai.enabled} />
    </div>
  );
}
