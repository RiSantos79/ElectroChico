import { getBrandsAdmin } from "@/lib/api";
import { createBrandAction, updateBrandAction } from "@/lib/admin-actions";

export const metadata = { title: "Marcas — Backoffice" };

export default async function AdminBrandsPage() {
  const brands = await getBrandsAdmin();

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Marcas ({brands.length})</h1>

      <section className="mb-8 max-w-xl rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Nova marca</h2>
        <form action={createBrandAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Nome
            <input name="name" required className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Logótipo (opcional)
            <input type="file" name="logo" accept="image/*" className="input-field" />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Criar marca
          </button>
        </form>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <form
            key={brand.id}
            action={updateBrandAction.bind(null, brand.id)}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4"
          >
            <div className="flex items-center gap-3">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logótipo de marca vindo da API, não vale a pena otimizar
                <img src={brand.logoUrl} alt={brand.name} className="size-10 rounded-lg object-contain" />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="text-xs text-muted">
                {brand.productCount} {brand.productCount === 1 ? "produto" : "produtos"}
              </p>
            </div>
            <input name="name" defaultValue={brand.name} className="input-field text-sm" />
            <input type="file" name="logo" accept="image/*" className="text-xs" />
            <button
              type="submit"
              className="self-start text-sm font-medium text-accent hover:underline"
            >
              Guardar
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
