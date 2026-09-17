import { getBrandsAdmin } from "@/lib/api";
import { createBrandAction } from "@/lib/admin-actions";
import { BrandsTable } from "@/components/admin/brands-table";

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

      <BrandsTable brands={brands} />
    </div>
  );
}
