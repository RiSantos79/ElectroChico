export type Category = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  subcategories: string[];
};

export type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  price: number;
  oldPrice?: number;
  energyClass: EnergyClass;
  rating: number;
  reviews: number;
  stockQuantity: number;
  badge?: "promo" | "novo" | "mais-vendido";
  color: string;
  images: string[];
  description: string;
  specs: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  sku?: string;
  ean?: string;
  weightKg?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  warrantyMonths?: number;
  metaTitle?: string;
  metaDescription?: string;
  archived?: boolean;
};

export const energyClasses: EnergyClass[] = ["A", "B", "C", "D", "E", "F", "G"];

// Links de navegação institucionais/promocionais — não vêm da base de dados.
export const promoLinks = [
  { label: "Outlet", href: "/outlet" },
  { label: "Ofertas Flash", href: "/ofertas-flash" },
  { label: "Cartões Presente", href: "/catalogo/cartoes-presente" },
];

export const topNavLinks = [
  { label: "Entregas", href: "/entregas" },
  { label: "Orçamentos", href: "/orcamentos" },
  { label: "Contacto", href: "/contacto" },
];
