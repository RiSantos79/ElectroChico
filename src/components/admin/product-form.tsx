import { energyClasses } from "@/data/catalog";
import type { AdminCategory, AdminProduct } from "@/lib/api";

const stockOptions: { value: AdminProduct["stock"]; label: string }[] = [
  { value: "IN_STOCK", label: "Em stock" },
  { value: "LOW_STOCK", label: "Últimas unidades" },
  { value: "OUT_OF_STOCK", label: "Indisponível" },
];

const badgeOptions: { value: NonNullable<AdminProduct["badge"]>; label: string }[] = [
  { value: "PROMO", label: "Promoção" },
  { value: "NOVO", label: "Novo" },
  { value: "MAIS_VENDIDO", label: "Mais vendido" },
];

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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Preço (€)
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product?.price}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Preço antigo (€) — opcional
            <input
              name="oldPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.oldPrice ?? undefined}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Classe energética
            <select name="energyClass" required defaultValue={product?.energyClass} className="input-field">
              {energyClasses.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Estado de stock
            <select name="stock" required defaultValue={product?.stock ?? "IN_STOCK"} className="input-field">
              {stockOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Destaque — opcional
            <select name="badge" defaultValue={product?.badge ?? ""} className="input-field">
              <option value="">Sem destaque</option>
              {badgeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cor (para o placeholder de imagem)
            <input name="color" type="text" defaultValue={product?.color ?? "#1f2937"} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Avaliação média (0-5)
            <input
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={product?.rating ?? 0}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Nº de avaliações
            <input name="reviews" type="number" min="0" defaultValue={product?.reviews ?? 0} className="input-field" />
          </label>
        </div>
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
