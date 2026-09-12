import type { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);

  const staticRoutes = ["", "/catalogo", "/outlet", "/ofertas-flash", "/entregas", "/orcamentos", "/contacto"].map(
    (path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() }),
  );

  const categoryRoutes = categories.map((c) => ({
    url: `${SITE_URL}/catalogo/${c.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/produto/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
