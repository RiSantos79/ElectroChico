import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getBrandBySlug, getProducts } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};

  const title = brand.name;
  const description = `Compre produtos ${brand.name} na ElectroChico — os melhores preços, entrega rápida e garantia oficial.`;
  return {
    title,
    description,
    alternates: { canonical: `/marca/${slug}` },
    openGraph: {
      title,
      description,
      images: brand.logoUrl ? [{ url: brand.logoUrl }] : undefined,
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const products = await getProducts({ brand: slug });

  return <CatalogView title={brand.name} products={products} logoImage={brand.logoUrl} />;
}
