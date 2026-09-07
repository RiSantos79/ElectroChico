import type { Category, EnergyClass, Product } from "@/data/catalog";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

const stockMap = {
  IN_STOCK: "in-stock",
  LOW_STOCK: "low-stock",
  OUT_OF_STOCK: "out-of-stock",
} as const;

const badgeMap = {
  PROMO: "promo",
  NOVO: "novo",
  MAIS_VENDIDO: "mais-vendido",
} as const;

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: { slug: string; name: string; subcategories: string[] };
  price: string;
  oldPrice: string | null;
  energyClass: EnergyClass;
  rating: number;
  reviews: number;
  stock: keyof typeof stockMap;
  badge: keyof typeof badgeMap | null;
  color: string;
  description: string;
  specs: { label: string; value: string }[];
};

function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category.slug,
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
    energyClass: p.energyClass,
    rating: p.rating,
    reviews: p.reviews,
    stock: stockMap[p.stock],
    badge: p.badge ? badgeMap[p.badge] : undefined,
    color: p.color,
    description: p.description,
    specs: p.specs,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`API ${path} respondeu ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export async function getProducts(params?: { category?: string }) {
  const query = params?.category ? `?category=${encodeURIComponent(params.category)}` : "";
  const products = await apiFetch<ApiProduct[]>(`/products${query}`);
  return products.map(mapProduct);
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await apiFetch<ApiProduct>(`/products/${encodeURIComponent(slug)}`);
    return mapProduct(product);
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export type AdminCategory = Category & { id: string };

export async function getCategoriesAdmin(): Promise<AdminCategory[]> {
  return apiFetch<AdminCategory[]>("/categories");
}

// --- Admin (backoffice) ---
// Usa diretamente os valores de enum da API (IN_STOCK, PROMO, ...) em vez de os
// converter, para não precisar de um mapeador de ida-e-volta só para o backoffice.

export type AdminProduct = Omit<ApiProduct, "category"> & { categoryId: string };

export type AdminProductInput = {
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  energyClass: EnergyClass;
  rating: number;
  reviews: number;
  stock: keyof typeof stockMap;
  badge?: keyof typeof badgeMap;
  color: string;
  description: string;
  specs: { label: string; value: string }[];
};

export async function getProductById(id: string): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/products/by-id/${encodeURIComponent(id)}`);
}

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export function createProduct(data: AdminProductInput, token: string) {
  return apiFetch("/products", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: Partial<AdminProductInput>, token: string) {
  return apiFetch(`/products/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function deleteProduct(id: string, token: string) {
  return apiFetch(`/products/${id}`, { method: "DELETE", headers: authHeaders(token) });
}
