import type { AdminCategory, AdminProduct } from "@/lib/api";
import { PriceStockFields } from "@/components/admin/price-stock-fields";

function specsToText(specs: { label: string; value: string }[]) {
  return specs.map((s) => `${s.label}: ${s.value}`).join("\n");
}

export function ProductForm({
  categories,
  product,
  action,
}: {
  categories: AdminCategory[];
  product?: AdminProduct;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Informação geral</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Nome
            <input name="name" required defaultValue={product?.name} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Slug (URL)
            <input name="slug" required defaultValue={product?.slug} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Marca
            <input name="brand" required defaultValue={product?.brand} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Categoria
            <select name="categoryId" required defaultValue={product?.categoryId} className="input-field">
              <option value="" disabled>
                Escolha uma categoria
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Preço e stock</h2>
        <PriceStockFields product={product} />
        {product && (
          <p className="mt-4 text-sm text-muted">
            Avaliação atual: <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span> (
            {product.reviewCount} {product.reviewCount === 1 ? "avaliação" : "avaliações"}) — vem sempre das
            avaliações dos clientes, não é editável aqui.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Descrição e especificações</h2>
        <label className="flex flex-col gap-1 text-sm">
          Descrição
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={product?.description}
            className="input-field resize-none"
          />
        </label>
        <label className="mt-4 flex flex-col gap-1 text-sm">
          Especificações técnicas — uma por linha, no formato <code>Nome: Valor</code>
          <textarea
            name="specs"
            rows={5}
            defaultValue={product ? specsToText(product.specs) : ""}
            placeholder={"Capacidade: 9 kg\nClasse energética: B"}
            className="input-field resize-none font-mono text-xs"
          />
        </label>
      </section>

      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        {product ? "Guardar alterações" : "Criar produto"}
      </button>
    </form>
  );
}
