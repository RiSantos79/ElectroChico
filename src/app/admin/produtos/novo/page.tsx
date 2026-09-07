import { ProductForm } from "@/components/admin/product-form";
import { getCategoriesAdmin } from "@/lib/api";
import { createProductAction } from "@/lib/admin-actions";

export const metadata = { title: "Novo produto — Backoffice" };

export default async function NewProductPage() {
  const categories = await getCategoriesAdmin();

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Novo produto</h1>
      <ProductForm categories={categories} action={createProductAction} />
    </div>
  );
}
