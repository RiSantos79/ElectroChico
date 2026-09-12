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
  if (!res.ok) {
    const body = await res.text();
    let message = `API ${path} respondeu ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.message) message = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
    } catch {
      // corpo não era JSON — mantém a mensagem genérica
    }
    throw new Error(message);
  }
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

export type AuditLog = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  actor: string | null;
  ip: string | null;
  createdAt: string;
};

export async function getAuditLogs(token: string): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>("/audit-logs", { headers: { Authorization: `Bearer ${token}` } });
}

// --- Encomendas ---

export type CreateOrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  streetNumber: string;
  floor?: string;
  postalCode: string;
  city: string;
  items: { productId: string; quantity: number; recipientEmail?: string; giftMessage?: string }[];
};

export function createOrder(
  input: CreateOrderInput,
  customerToken?: string,
): Promise<{ orderId: string; checkoutUrl: string }> {
  return apiFetch("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
    },
    body: JSON.stringify(input),
  });
}

export type Order = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  customerName: string;
  customerEmail: string;
  total: string;
  createdAt: string;
  items: { id: string; productName: string; unitPrice: string; quantity: number }[];
  giftCards?: { code: string; value: string; recipientEmail: string | null; message: string | null }[];
};

export async function getOrder(id: string): Promise<Order | null> {
  try {
    return await apiFetch<Order>(`/orders/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export function getOrdersAdmin(token: string): Promise<Order[]> {
  return apiFetch<Order[]>("/orders", { headers: { Authorization: `Bearer ${token}` } });
}

export function getMyOrders(token: string): Promise<Order[]> {
  return apiFetch<Order[]>("/orders/me", { headers: { Authorization: `Bearer ${token}` } });
}

// --- Conta de cliente ---

export type Address = {
  id: string;
  label: string | null;
  street: string;
  streetNumber: string;
  floor: string | null;
  postalCode: string;
  city: string;
  phone: string | null;
  isDefault: boolean;
};

export type AddressInput = {
  label?: string;
  street: string;
  streetNumber: string;
  floor?: string;
  postalCode: string;
  city: string;
  phone?: string;
  isDefault?: boolean;
};

export function getMyAddresses(token: string): Promise<Address[]> {
  return apiFetch<Address[]>("/addresses/me", { headers: { Authorization: `Bearer ${token}` } });
}

export function createAddress(data: AddressInput, token: string) {
  return apiFetch("/addresses", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function updateAddress(id: string, data: AddressInput, token: string) {
  return apiFetch(`/addresses/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function deleteAddress(id: string, token: string) {
  return apiFetch(`/addresses/${id}`, { method: "DELETE", headers: authHeaders(token) });
}

export function updateProfile(name: string, token: string): Promise<{ accessToken: string }> {
  return apiFetch("/auth/me", { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ name }) });
}

export function changePassword(currentPassword: string, newPassword: string, token: string) {
  return apiFetch("/auth/change-password", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- Sugestões / Mensagens / RMA ---

export type ContactType = "SUGGESTION" | "MESSAGE" | "RMA";

export type ContactMessage = {
  id: string;
  type: ContactType;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  orderId: string | null;
  productName: string | null;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type ContactMessageInput = {
  type: ContactType;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  body: string;
  orderId?: string;
  productName?: string;
};

export function createContactMessage(data: ContactMessageInput, customerToken?: string) {
  return apiFetch("/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
    },
    body: JSON.stringify(data),
  });
}

export function getMyContactMessages(type: ContactType, token: string): Promise<ContactMessage[]> {
  return apiFetch<ContactMessage[]>(`/contact/me?type=${type}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function getAdminContactMessages(token: string, type?: ContactType): Promise<ContactMessage[]> {
  const query = type ? `?type=${type}` : "";
  return apiFetch<ContactMessage[]>(`/contact${query}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function replyContactMessage(id: string, reply: string, token: string) {
  return apiFetch(`/contact/${id}/reply`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify({ reply }) });
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

// --- Cartões presente (admin) ---

export type GiftCard = {
  id: string;
  code: string;
  value: string;
  status: "ACTIVE" | "REDEEMED";
  buyerEmail: string;
  recipientEmail: string | null;
  message: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
  createdAt: string;
};

export async function getGiftCard(code: string, token: string): Promise<GiftCard | null> {
  try {
    return await apiFetch<GiftCard>(`/gift-cards/${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
}

export function redeemGiftCard(code: string, token: string): Promise<GiftCard> {
  return apiFetch<GiftCard>(`/gift-cards/${encodeURIComponent(code)}/redeem`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
