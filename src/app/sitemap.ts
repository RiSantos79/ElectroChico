import type { MetadataRoute } from "next";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    getProducts().catch(() => []),
    getCategories().catch(() => []),
    getBrands().catch(() => []),
  ]);

  const staticRoutes = [
    "",
    "/catalogo",
    "/outlet",
    "/ofertas-flash",
    "/entregas",
    "/orcamentos",
    "/contacto",
    "/privacidade",
  ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() }));

  const categoryRoutes = categories.map((c) => ({
    url: `${SITE_URL}/catalogo/${c.slug}`,
    lastModified: new Date(),
  }));

  const brandRoutes = brands.map((b) => ({
    url: `${SITE_URL}/marca/${b.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/produto/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
}
