import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/data/catalog";
import { getCategories, getProducts } from "@/lib/api";

export default async function Home() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const promoProducts = products.filter((p) => p.badge === "promo");
  const bestsellers = products.filter((p) => p.badge === "mais-vendido");
  const newArrivals = products.filter((p) => p.badge === "novo");

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Hero */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-center gap-4 rounded-2xl bg-gradient-to-br from-accent to-blue-800 p-8 text-accent-foreground md:col-span-2 md:p-12">
          <span className="text-sm font-medium uppercase tracking-wide opacity-80">
            Campanha da semana
          </span>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            Até 30% de desconto em eletrodomésticos de cozinha
          </h1>
          <p className="max-w-md text-sm opacity-90">
            Renove a sua cozinha com as melhores marcas e entrega rápida em todo o país.
          </p>
          <Link
            href="/catalogo/eletrodomesticos"
            className="w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-accent hover:opacity-90"
          >
            Ver ofertas
          </Link>
        </div>
        <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border bg-surface p-8">
          <span className="text-sm font-medium uppercase tracking-wide text-muted">Destaque</span>
          <h2 className="text-xl font-semibold">Imagem e Som</h2>
          <p className="text-sm text-muted">TVs, home cinema e o melhor em entretenimento.</p>
          <Link href="/catalogo/imagem-e-som" className="w-fit text-sm font-medium text-accent hover:underline">
            Explorar →
          </Link>
        </div>
      </section>

      {/* Category tiles */}
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Comprar por categoria</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalogo/${category.slug}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-raised p-4 text-center text-sm font-medium hover:border-accent hover:text-accent"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {promoProducts.length > 0 && (
        <ProductSection title="Promoções em destaque" products={promoProducts} />
      )}
      {bestsellers.length > 0 && (
        <ProductSection title="Mais vendidos" products={bestsellers} />
      )}
      {newArrivals.length > 0 && <ProductSection title="Novidades" products={newArrivals} />}

      {/* Brands */}
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Top marcas</h2>
        <div className="flex flex-wrap gap-3">
          {brands.map((brand) => (
            <span
              key={brand}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductSection({ title, products: items }: { title: string; products: Product[] }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href="/catalogo" className="text-sm font-medium text-accent hover:underline">
          Ver tudo →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
