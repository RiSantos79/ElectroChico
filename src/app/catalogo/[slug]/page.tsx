import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getCategories, getProducts } from "@/lib/api";

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

  return <CatalogView title={category.name} products={categoryProducts} />;
}
