import { notFound, redirect } from "next/navigation";
import { getBrandsAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { updateBrandAction } from "@/lib/admin-actions";

export const metadata = { title: "Editar marca — Backoffice" };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { id } = await params;
  const brands = await getBrandsAdmin();
  const brand = brands.find((b) => b.id === id);
  if (!brand) notFound();

  return (
    <div className="max-w-xl px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Editar marca</h1>
      <form action={updateBrandAction.bind(null, brand.id)} className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-6">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logótipo de marca vindo da API, não vale a pena otimizar
            <img src={brand.logoUrl} alt={brand.name} className="size-14 rounded-lg object-contain" />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-lg bg-surface text-sm text-muted">
              {brand.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <p className="text-xs text-muted">
            {brand.productCount} {brand.productCount === 1 ? "produto" : "produtos"}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input name="name" defaultValue={brand.name} required className="input-field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Novo logótipo (opcional — substitui o atual)
          <input type="file" name="logo" accept="image/*" className="input-field" />
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Guardar alterações
        </button>
      </form>
    </div>
  );
}
