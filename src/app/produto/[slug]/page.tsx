import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getProductBySlug, getProducts, getReviews } from "@/lib/api";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductActions } from "@/components/product-actions";
import { ProductStockBar } from "@/components/product-stock-bar";
import { StickyBuyBar } from "@/components/sticky-buy-bar";
import { ProductTabs } from "@/components/product-tabs";
import { SITE_URL } from "@/lib/site";

// A descrição é HTML (editor de texto do admin) — para metadados/SEO
// precisamos só do texto, sem as tags.
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const description = stripHtml(product.description).slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

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
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(100 - (product.price / product.oldPrice) * 100)
      : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.description),
    image: product.images,
    sku: product.slug,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/produto/${product.slug}`,
      priceCurrency: "EUR",
      price: product.price,
      availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviews,
      },
    }),
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            {discount && (
              <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-muted">Classe energética {product.energyClass}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>✓</span> Garantia de acordo com a legislação em vigor
            </span>
          </div>

          <ProductStockBar product={product} className="mt-4 max-w-56" />

          <ProductActions product={product} />
          <StickyBuyBar product={product} />
        </div>
      </div>

      <ProductTabs
        description={product.description}
        specs={product.specs}
        reviews={reviews}
        productId={product.id}
        productSlug={product.slug}
      />

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
