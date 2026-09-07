import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getCategoriesAdmin, getProductById } from "@/lib/api";
import { updateProductAction } from "@/lib/admin-actions";

export const metadata = { title: "Editar produto — Backoffice" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    getCategoriesAdmin(),
    getProductById(id).catch(() => null),
  ]);
  if (!product) notFound();

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Editar produto</h1>
      <ProductForm categories={categories} product={product} action={updateProductAction.bind(null, id)} />
    </div>
  );
}
