import { getCategoriesAdmin } from "@/lib/api";
import { updateCategoryImageAction } from "@/lib/admin-actions";

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <form
            key={category.id}
            action={updateCategoryImageAction.bind(null, category.id)}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4"
          >
            {category.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagem de categoria vinda da API, não vale a pena otimizar
              <img src={category.imageUrl} alt={category.name} className="h-32 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                Sem imagem
              </div>
            )}
            <p className="text-sm font-medium text-foreground">{category.name}</p>
            <input type="file" name="logo" accept="image/*" className="text-xs" />
            <button type="submit" className="self-start text-sm font-medium text-accent hover:underline">
              Guardar imagem
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
