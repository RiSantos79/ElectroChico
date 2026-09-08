import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getProductBySlug, getProducts, getReviews } from "@/lib/api";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductActions } from "@/components/product-actions";
import { ReviewForm } from "@/components/review-form";
import { ProductStockBar } from "@/components/product-stock-bar";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const categoryProducts = await getProducts({ category: product.category });
  const related = categoryProducts.filter((p) => p.slug !== slug);
  const reviews = await getReviews(product.id);

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} color={product.color} name={product.name} />

        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-muted">{product.brand}</span>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span aria-hidden>★</span>
            <span>{product.rating.toFixed(1)}</span>
            <span>({product.reviews} avaliações)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-muted">Classe energética {product.energyClass}</p>

          <ProductStockBar product={product} className="mt-4 max-w-56" />

          <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

          <ProductActions product={product} />

          <dl className="mt-8 divide-y divide-border rounded-xl border border-border">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">{spec.label}</dt>
                <dd className="font-medium text-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="mt-14 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">Avaliações de clientes</h2>
        {reviews.length > 0 ? (
          <ul className="mb-6 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{r.authorName}</span>
                  <span className="text-sm text-muted">{"★".repeat(r.rating)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 text-sm text-muted">Ainda não há avaliações — sê o primeiro a deixar uma.</p>
        )}
        <ReviewForm productId={product.id} productSlug={product.slug} />
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-semibold">Produtos relacionados</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
