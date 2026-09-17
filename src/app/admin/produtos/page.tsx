import Link from "next/link";
import { getProducts } from "@/lib/api";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata = { title: "Produtos — Backoffice" };

export default async function AdminProductsPage() {
  const products = await getProducts({ includeArchived: true });

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produtos ({products.length})</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/produtos/importar"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Importar CSV
          </Link>
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

      <ProductsTable products={products} />
    </div>
  );
}
