import { getCategoriesAdmin } from "@/lib/api";
import { CategoriesGrid } from "@/components/admin/categories-grid";

export const metadata = { title: "Categorias — Backoffice" };

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesAdmin();

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Categorias ({categories.length})</h1>
      <p className="mb-6 text-sm text-muted">
        As categorias em si vêm do catálogo base — aqui só é possível associar uma imagem de destaque a cada uma,
        usada na página da categoria.
      </p>

      <CategoriesGrid categories={categories} />
    </div>
  );
}
