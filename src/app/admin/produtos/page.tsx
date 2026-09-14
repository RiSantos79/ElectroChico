import Link from "next/link";
import { getProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { deleteProductAction, duplicateProductAction } from "@/lib/admin-actions";
import { StockBar } from "@/components/stock-bar";

export const metadata = { title: "Produtos — Backoffice" };

export default async function AdminProductsPage() {
  const products = await getProducts({ includeArchived: true });

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produtos ({products.length})</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/produtos/export"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Exportar CSV
          </Link>
          <Link
            href="/admin/produtos/novo"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            + Novo produto
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {product.name}
                  {product.archived && (
                    <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                      Arquivado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{product.brand}</td>
                <td className="px-4 py-3 text-muted">{product.category}</td>
                <td className="px-4 py-3 text-foreground">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  <StockBar quantity={product.stockQuantity} className="w-32" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="font-medium text-accent hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={duplicateProductAction.bind(null, product.id)}>
                      <button type="submit" className="font-medium text-accent hover:underline">
                        Duplicar
                      </button>
                    </form>
                    <form action={deleteProductAction.bind(null, product.id)}>
                      <button type="submit" className="font-medium text-danger hover:underline">
                        Apagar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
