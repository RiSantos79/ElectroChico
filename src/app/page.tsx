import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/data/catalog";
import { getBanners, getCategories, getProducts, type Banner } from "@/lib/api";
import { GIFT_CARD_CATEGORY_SLUG } from "@/lib/gift-cards";

// Único fallback caso o admin apague todos os banners — sem isto a homepage
// ficava sem <h1> nenhum no hero.
const fallbackBanners: Banner[] = [
  {
    id: "fallback-large",
    size: "LARGE",
    eyebrow: "Campanha da semana",
    title: "Até 30% de desconto em eletrodomésticos de cozinha",
    description: "Renove a sua cozinha com as melhores marcas e entrega rápida em todo o país.",
    linkUrl: "/catalogo/eletrodomesticos",
    ctaLabel: "Ver ofertas",
    imageUrl: null,
    order: 0,
    active: true,
  },
];

export default async function Home() {
  const [products, categories, banners] = await Promise.all([
    getProducts(),
    getCategories(),
    getBanners().catch(() => []),
  ]);
  const shoppableCategories = categories.filter((c) => c.slug !== GIFT_CARD_CATEGORY_SLUG);
  const shoppableProducts = products.filter((p) => p.category !== GIFT_CARD_CATEGORY_SLUG);
  const brands = Array.from(new Set(shoppableProducts.map((p) => p.brand))).sort();
  const promoProducts = shoppableProducts.filter((p) => p.badge === "promo");
  const bestsellers = shoppableProducts.filter((p) => p.badge === "mais-vendido");
  const newArrivals = shoppableProducts.filter((p) => p.badge === "novo");
  const heroBanners = banners.length > 0 ? banners : fallbackBanners;

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Hero */}
      <section className="grid gap-4 md:grid-cols-3">
        {heroBanners.map((banner, i) => (
          <HeroBanner key={banner.id} banner={banner} useH1={i === 0} />
        ))}
      </section>

      {/* Category tiles */}
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Comprar por categoria</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shoppableCategories.map((category) => (
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

function HeroBanner({ banner, useH1 }: { banner: Banner; useH1: boolean }) {
  const isLarge = banner.size === "LARGE";
  const HeadingTag = useH1 ? "h1" : "h2";
  const style = banner.imageUrl
    ? {
        backgroundImage: `linear-gradient(to bottom right, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), url(${banner.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  if (isLarge) {
    return (
      <div
        className={`flex flex-col justify-center gap-4 rounded-2xl p-8 text-accent-foreground md:col-span-2 md:p-12 ${
          banner.imageUrl ? "" : "bg-gradient-to-br from-accent to-blue-800"
        }`}
        style={style}
      >
        {banner.eyebrow && (
          <span className="text-sm font-medium uppercase tracking-wide opacity-80">{banner.eyebrow}</span>
        )}
        <HeadingTag className="text-3xl font-bold leading-tight md:text-4xl">{banner.title}</HeadingTag>
        {banner.description && <p className="max-w-md text-sm opacity-90">{banner.description}</p>}
        {banner.ctaLabel && (
          <Link
            href={banner.linkUrl}
            className="w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:opacity-90"
          >
            {banner.ctaLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border bg-surface p-8" style={style}>
      {banner.eyebrow && (
        <span className="text-sm font-medium uppercase tracking-wide text-muted">{banner.eyebrow}</span>
      )}
      <HeadingTag className="text-xl font-semibold">{banner.title}</HeadingTag>
      {banner.description && <p className="text-sm text-muted">{banner.description}</p>}
      {banner.ctaLabel && (
        <Link href={banner.linkUrl} className="w-fit text-sm font-medium text-accent hover:underline">
          {banner.ctaLabel} →
        </Link>
      )}
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
