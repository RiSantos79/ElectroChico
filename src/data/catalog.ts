export type Category = {
  slug: string;
  name: string;
  subcategories: string[];
};

export type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
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
