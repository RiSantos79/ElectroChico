import type { AdminBrand, AdminCategory, AdminProduct } from "@/lib/api";
import { PriceStockFields } from "@/components/admin/price-stock-fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { NameSlugFields } from "@/components/admin/name-slug-fields";

function specsToText(specs: { label: string; value: string }[]) {
  return specs.map((s) => `${s.label}: ${s.value}`).join("\n");
}

export function ProductForm({
  categories,
  brands,
  product,
  action,
}: {
  categories: AdminCategory[];
  brands: AdminBrand[];
  product?: AdminProduct;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Informação geral</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NameSlugFields defaultName={product?.name} defaultSlug={product?.slug} />
          <label className="flex flex-col gap-1 text-sm">
            Marca
            <select name="brandId" required defaultValue={product?.brandId} className="input-field">
              <option value="" disabled>
                Escolha uma marca
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
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
        {product && (
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" name="archived" defaultChecked={product.archived} className="size-4" />
            Produto arquivado (escondido do catálogo, mas continua editável aqui)
          </label>
        )}
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
        <div className="flex flex-col gap-1 text-sm">
          Descrição
          <RichTextEditor name="description" defaultValue={product?.description} />
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm">
          Especificações técnicas — uma por linha, no formato <code>Nome: Valor</code> (também aceita colar
          diretamente de uma tabela ou folha de cálculo, com colunas separadas por tab)
          <textarea
            name="specs"
            rows={5}
            defaultValue={product ? specsToText(product.specs) : ""}
            placeholder={"Capacidade: 9 kg\nClasse energética: B"}
            className="input-field resize-none font-mono text-xs"
          />
        </label>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Logística e identificação</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            SKU (referência interna)
            <input name="sku" defaultValue={product?.sku ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            EAN (código de barras)
            <input name="ean" defaultValue={product?.ean ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Peso (kg)
            <input
              type="number"
              step="0.01"
              min="0"
              name="weightKg"
              defaultValue={product?.weightKg ?? ""}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Garantia (meses)
            <input
              type="number"
              min="0"
              name="warrantyMonths"
              defaultValue={product?.warrantyMonths ?? ""}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Largura (cm)
            <input
              type="number"
              step="0.1"
              min="0"
              name="widthCm"
              defaultValue={product?.widthCm ?? ""}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Altura (cm)
            <input
              type="number"
              step="0.1"
              min="0"
              name="heightCm"
              defaultValue={product?.heightCm ?? ""}
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Profundidade (cm)
            <input
              type="number"
              step="0.1"
              min="0"
              name="depthCm"
              defaultValue={product?.depthCm ?? ""}
              className="input-field"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">SEO</h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Meta título (opcional — usa o nome do produto se ficar vazio)
            <input name="metaTitle" defaultValue={product?.metaTitle ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Meta descrição (opcional — usa o início da descrição se ficar vazio)
            <textarea
              name="metaDescription"
              rows={2}
              defaultValue={product?.metaDescription ?? ""}
              className="input-field resize-none"
            />
          </label>
        </div>
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
