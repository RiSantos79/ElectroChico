import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAiStatus, getBrandsAdmin, getCategoriesAdmin, getProductById } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { duplicateProductAction, updateProductAction } from "@/lib/admin-actions";

export const metadata = { title: "Editar produto — Backoffice" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getSessionToken();
  const [categories, brands, product, ai] = await Promise.all([
    getCategoriesAdmin(),
    getBrandsAdmin(),
    getProductById(id).catch(() => null),
    token ? getAiStatus(token).catch(() => ({ enabled: false })) : Promise.resolve({ enabled: false }),
  ]);
  if (!product) notFound();

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Editar produto</h1>
        <form action={duplicateProductAction.bind(null, id)}>
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Duplicar produto
          </button>
        </form>
      </div>
      <ProductForm
        categories={categories}
        brands={brands}
        product={product}
        action={updateProductAction.bind(null, id)}
        aiEnabled={ai.enabled}
      />
    </div>
  );
}
