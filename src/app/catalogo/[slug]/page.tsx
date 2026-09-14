import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getCategories, getProducts } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  const title = category.name;
  const description = `Descubra a gama de ${category.name} da ElectroChico — os melhores preços, entrega rápida e garantia oficial.`;
  return {
    title,
    description,
    alternates: { canonical: `/catalogo/${slug}` },
    openGraph: {
      title,
      description,
      images: category.imageUrl ? [{ url: category.imageUrl }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryProducts = await getProducts({ category: slug });

  return <CatalogView title={category.name} products={categoryProducts} bannerImage={category.imageUrl} />;
}
