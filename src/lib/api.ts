import type { Category, EnergyClass, Product } from "@/data/catalog";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

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
  reviewCount: number;
  images: string[];
  stockQuantity: number;
  badge: keyof typeof badgeMap | null;
  color: string;
  description: string;
  specs: { label: string; value: string }[];
};

// As imagens vêm da API como caminhos relativos (ex. "/uploads/x.png") —
// tornam-se absolutas aqui para o browser as conseguir carregar diretamente.
function absoluteMediaUrl(path: string) {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

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
    reviews: p.reviewCount,
    stockQuantity: p.stockQuantity,
    badge: p.badge ? badgeMap[p.badge] : undefined,
    color: p.color,
    images: p.images.map(absoluteMediaUrl),
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

// --- Avaliações ---
// Só de leitura + criação pública — a média/contagem são sempre calculadas
// pela API a partir destas linhas, nunca definidas manualmente.

export type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export async function getReviews(productId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/products/${productId}/reviews`);
}

export function submitReview(productId: string, data: { authorName: string; rating: number; comment?: string }) {
  return apiFetch(`/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// --- Admin (backoffice) ---
// Usa diretamente os valores de enum da API (IN_STOCK, PROMO, ...) em vez de os
// converter, para não precisar de um mapeador de ida-e-volta só para o backoffice.
// rating/reviewCount não aparecem aqui de propósito — vêm sempre de avaliações reais.

export type AdminProduct = Omit<ApiProduct, "category"> & { categoryId: string };

export type AdminProductInput = {
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  energyClass: EnergyClass;
  stockQuantity: number;
  badge?: keyof typeof badgeMap;
  color: string;
  images: string[];
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

export async function uploadImage(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Falha no upload (${res.status})`);
  const { url } = await res.json();
  return url as string;
}
