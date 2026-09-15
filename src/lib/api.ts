import type { Category, EnergyClass, Product } from "@/data/catalog";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

const badgeMap = {
  PROMO: "promo",
  NOVO: "novo",
  MAIS_VENDIDO: "mais-vendido",
} as const;

type ApiBrand = { id: string; slug: string; name: string; logoUrl: string | null };

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  brand: ApiBrand;
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
  sku: string | null;
  ean: string | null;
  weightKg: number | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  warrantyMonths: number | null;
  archived: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
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
    brand: p.brand.name,
    brandSlug: p.brand.slug,
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
    sku: p.sku ?? undefined,
    ean: p.ean ?? undefined,
    weightKg: p.weightKg ?? undefined,
    widthCm: p.widthCm ?? undefined,
    heightCm: p.heightCm ?? undefined,
    depthCm: p.depthCm ?? undefined,
    warrantyMonths: p.warrantyMonths ?? undefined,
    metaTitle: p.metaTitle ?? undefined,
    metaDescription: p.metaDescription ?? undefined,
    archived: p.archived,
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

export type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  brand: { name: string };
};

export async function searchProducts(q: string): Promise<ProductSearchResult[]> {
  const results = await apiFetch<(Omit<ProductSearchResult, "price"> & { price: string })[]>(
    `/products/search?q=${encodeURIComponent(q)}`,
  );
  return results.map((r) => ({ ...r, price: Number(r.price) }));
}

export async function getProducts(params?: { category?: string; brand?: string; includeArchived?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.brand) query.set("brand", params.brand);
  if (params?.includeArchived) query.set("includeArchived", "true");
  const qs = query.toString();
  const products = await apiFetch<ApiProduct[]>(`/products${qs ? `?${qs}` : ""}`);
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

export function updateCategory(id: string, data: { imageUrl?: string }, token: string) {
  return apiFetch<AdminCategory>(`/categories/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// --- Marcas ---

export type Brand = { id: string; slug: string; name: string; logoUrl: string | null };
export type AdminBrand = Brand & { productCount: number };

export async function getBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>("/brands");
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    return await apiFetch<Brand>(`/brands/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getBrandsAdmin(): Promise<AdminBrand[]> {
  return apiFetch<AdminBrand[]>("/brands");
}

export function createBrand(data: { name: string; logoUrl?: string }, token: string) {
  return apiFetch<Brand>("/brands", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function updateBrand(id: string, data: { name?: string; logoUrl?: string }, token: string) {
  return apiFetch<Brand>(`/brands/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
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

export type AdminProduct = Omit<ApiProduct, "category" | "brand"> & { categoryId: string; brandId: string };

export type AdminProductInput = {
  slug: string;
  name: string;
  brandId: string;
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
  sku?: string;
  ean?: string;
  weightKg?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  warrantyMonths?: number;
  archived?: boolean;
  metaTitle?: string;
  metaDescription?: string;
};

export async function getProductById(id: string): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/products/by-id/${encodeURIComponent(id)}`);
}

function authHeaders(token: string, reauthToken?: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(reauthToken ? { "X-Reauth-Token": reauthToken } : {}),
  };
}

export function createProduct(data: AdminProductInput, token: string) {
  return apiFetch("/products", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: Partial<AdminProductInput>, token: string) {
  return apiFetch(`/products/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function deleteProduct(id: string, token: string, reauthToken?: string) {
  return apiFetch(`/products/${id}`, { method: "DELETE", headers: authHeaders(token, reauthToken) });
}

export function duplicateProduct(id: string, token: string): Promise<AdminProduct> {
  return apiFetch<AdminProduct>(`/products/${id}/duplicate`, { method: "POST", headers: authHeaders(token) });
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

export type AuditLogFilters = { actor?: string; action?: string; entity?: string; from?: string; to?: string };

export async function getAuditLogs(token: string, filters?: AuditLogFilters): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (filters?.actor) query.set("actor", filters.actor);
  if (filters?.action) query.set("action", filters.action);
  if (filters?.entity) query.set("entity", filters.entity);
  if (filters?.from) query.set("from", filters.from);
  if (filters?.to) query.set("to", filters.to);
  const qs = query.toString();
  return apiFetch<AuditLog[]>(`/audit-logs${qs ? `?${qs}` : ""}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function getAuditActions(token: string): Promise<string[]> {
  return apiFetch<string[]>("/audit-logs/actions", { headers: { Authorization: `Bearer ${token}` } });
}

export function getAuditEntities(token: string): Promise<string[]> {
  return apiFetch<string[]>("/audit-logs/entities", { headers: { Authorization: `Bearer ${token}` } });
}

// --- Stock ---

export type StockMovement = {
  id: string;
  productId: string;
  type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "RETURN";
  delta: number;
  reason: string | null;
  orderId: string | null;
  createdAt: string;
  product: { name: string; slug: string };
};

export async function getStockMovements(token: string): Promise<StockMovement[]> {
  return apiFetch<StockMovement[]>("/stock-movements", { headers: { Authorization: `Bearer ${token}` } });
}

// --- Newsletter ---

export type NewsletterSubscriber = {
  id: string;
  email: string;
  name: string | null;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

export type NewsletterCampaign = {
  id: string;
  subject: string;
  body: string;
  status: "DRAFT" | "SENT";
  sentAt: string | null;
  sentCount: number;
  createdAt: string;
};

export function getNewsletterSubscribers(token: string, includeUnsubscribed = false): Promise<NewsletterSubscriber[]> {
  const query = includeUnsubscribed ? "?includeUnsubscribed=true" : "";
  return apiFetch<NewsletterSubscriber[]>(`/newsletter/subscribers${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function unsubscribeNewsletter(id: string, token: string) {
  return apiFetch(`/newsletter/subscribers/${id}/unsubscribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getNewsletterCampaigns(token: string): Promise<NewsletterCampaign[]> {
  return apiFetch<NewsletterCampaign[]>("/newsletter/campaigns", { headers: { Authorization: `Bearer ${token}` } });
}

export function createNewsletterCampaign(data: { subject: string; body: string }, token: string) {
  return apiFetch<NewsletterCampaign>("/newsletter/campaigns", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function deleteNewsletterCampaign(id: string, token: string) {
  return apiFetch(`/newsletter/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export function sendNewsletterCampaign(
  id: string,
  token: string,
): Promise<{ sent: boolean; reason?: "not_configured" | "provider_error"; sentCount: number }> {
  return apiFetch(`/newsletter/campaigns/${id}/send`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

// --- Definições do site ---

export type SiteSettings = {
  companyName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  copyrightText?: string;
  trustBadge1Title?: string;
  trustBadge1Desc?: string;
  trustBadge2Title?: string;
  trustBadge2Desc?: string;
  trustBadge3Title?: string;
  trustBadge3Desc?: string;
  trustBadge4Title?: string;
  trustBadge4Desc?: string;
};

export function getSiteSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>("/site-settings");
}

export function updateSiteSettings(data: Partial<SiteSettings>, token: string): Promise<SiteSettings> {
  return apiFetch<SiteSettings>("/site-settings", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// --- Páginas de conteúdo ---

export type ContentPage = { id: string; slug: string; title: string; body: string; updatedAt: string };

export async function getContentPage(slug: string): Promise<ContentPage | null> {
  try {
    return await apiFetch<ContentPage>(`/content-pages/${slug}`);
  } catch {
    return null;
  }
}

export function getContentPagesAdmin(token: string): Promise<ContentPage[]> {
  return apiFetch<ContentPage[]>("/content-pages", { headers: { Authorization: `Bearer ${token}` } });
}

export function updateContentPage(slug: string, data: { title?: string; body?: string }, token: string) {
  return apiFetch<ContentPage>(`/content-pages/${slug}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

// --- Banners da homepage ---

export type Banner = {
  id: string;
  size: "LARGE" | "SMALL";
  eyebrow: string | null;
  title: string;
  description: string | null;
  linkUrl: string;
  ctaLabel: string | null;
  imageUrl: string | null;
  order: number;
  active: boolean;
};

export type BannerInput = {
  size: "LARGE" | "SMALL";
  eyebrow?: string;
  title: string;
  description?: string;
  linkUrl: string;
  ctaLabel?: string;
  imageUrl?: string;
  order?: number;
  active?: boolean;
};

export function getBanners(): Promise<Banner[]> {
  return apiFetch<Banner[]>("/banners");
}

export function getBannersAdmin(token: string): Promise<Banner[]> {
  return apiFetch<Banner[]>("/banners/all", { headers: { Authorization: `Bearer ${token}` } });
}

export function createBanner(data: BannerInput, token: string) {
  return apiFetch<Banner>("/banners", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function updateBanner(id: string, data: Partial<BannerInput>, token: string) {
  return apiFetch<Banner>(`/banners/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function deleteBanner(id: string, token: string) {
  return apiFetch(`/banners/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// --- Funcionários e permissões (RBAC) ---

export const MODULES = [
  "dashboard",
  "produtos",
  "categorias",
  "marcas",
  "stock",
  "encomendas",
  "clientes",
  "mensagens",
  "devolucoes",
  "garantias",
  "cupoes",
  "promocoes",
  "relatorios",
  "configuracoes",
  "utilizadores",
  "auditoria",
] as const;
export type Module = (typeof MODULES)[number];

export const ACTIONS = ["view", "create", "edit", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export const MODULE_LABELS: Record<Module, string> = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  categorias: "Categorias",
  marcas: "Marcas",
  stock: "Stock",
  encomendas: "Encomendas",
  clientes: "Clientes",
  mensagens: "Mensagens",
  devolucoes: "Devoluções",
  garantias: "Garantias",
  cupoes: "Cupões",
  promocoes: "Promoções",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  utilizadores: "Utilizadores",
  auditoria: "Auditoria",
};

export const ACTION_LABELS: Record<Action, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Eliminar",
  export: "Exportar",
};

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "STOCK_MANAGER"
  | "CUSTOMER_SUPPORT"
  | "MARKETING"
  | "FINANCE"
  | "OPERATOR"
  | "CUSTOMER";

export const STAFF_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "STOCK_MANAGER",
  "CUSTOMER_SUPPORT",
  "MARKETING",
  "FINANCE",
  "OPERATOR",
];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Gestor",
  STOCK_MANAGER: "Gestor de Stock",
  CUSTOMER_SUPPORT: "Apoio ao Cliente",
  MARKETING: "Marketing",
  FINANCE: "Financeiro",
  OPERATOR: "Operador",
  CUSTOMER: "Cliente",
};

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

export type PermissionMatrix = Record<Module, Record<Action, boolean>>;

export type Staff = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  jobTitle: string | null;
  role: Role;
  status: UserStatus;
  permissionOverrides: PermissionMatrix | null;
  effectivePermissions: PermissionMatrix;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  mfaEnabled: boolean;
  createdAt: string;
};

export type StaffInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  jobTitle?: string;
  role: Role;
};

export type StaffUpdateInput = {
  name?: string;
  phone?: string;
  jobTitle?: string;
  role?: Role;
};

export function getStaff(token: string): Promise<Staff[]> {
  return apiFetch<Staff[]>("/staff", { headers: { Authorization: `Bearer ${token}` } });
}

export function createStaff(data: StaffInput, token: string, reauthToken?: string): Promise<Staff> {
  return apiFetch<Staff>("/staff", {
    method: "POST",
    headers: authHeaders(token, reauthToken),
    body: JSON.stringify(data),
  });
}

export function updateStaff(
  id: string,
  data: StaffUpdateInput,
  token: string,
  reauthToken?: string,
): Promise<Staff> {
  return apiFetch<Staff>(`/staff/${id}`, {
    method: "PATCH",
    headers: authHeaders(token, reauthToken),
    body: JSON.stringify(data),
  });
}

export function updateStaffStatus(id: string, status: UserStatus, token: string): Promise<Staff> {
  return apiFetch<Staff>(`/staff/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export function updateStaffPermissions(
  id: string,
  overrides: PermissionMatrix | null,
  token: string,
  reauthToken?: string,
): Promise<Staff> {
  return apiFetch<Staff>(`/staff/${id}/permissions`, {
    method: "PATCH",
    headers: authHeaders(token, reauthToken),
    body: JSON.stringify({ overrides }),
  });
}

export function forceStaffPasswordReset(id: string, token: string): Promise<{ tempPassword: string }> {
  return apiFetch<{ tempPassword: string }>(`/staff/${id}/force-password-reset`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function forceStaffLogout(id: string, token: string) {
  return apiFetch(`/staff/${id}/force-logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

export function deleteStaff(id: string, token: string) {
  return apiFetch(`/staff/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

// --- Sessões ---

export type Session = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  current?: boolean;
};

export function getMySessions(token: string): Promise<Session[]> {
  return apiFetch<Session[]>("/auth/sessions", { headers: { Authorization: `Bearer ${token}` } });
}

export function revokeMySession(id: string, token: string) {
  return apiFetch(`/auth/sessions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export function revokeOtherSessions(token: string) {
  return apiFetch("/auth/sessions/revoke-others", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

export function getStaffSessions(id: string, token: string): Promise<Session[]> {
  return apiFetch<Session[]>(`/staff/${id}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
}

// --- Cupões ---

export type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderValue: string | null;
  maxUses: number | null;
  usesCount: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
};

export type CouponInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue?: number;
  maxUses?: number;
  validFrom?: string;
  validUntil?: string;
  active?: boolean;
};

export async function getCouponsAdmin(token: string): Promise<Coupon[]> {
  return apiFetch<Coupon[]>("/coupons", { headers: { Authorization: `Bearer ${token}` } });
}

export function createCoupon(data: CouponInput, token: string) {
  return apiFetch<Coupon>("/coupons", { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function updateCoupon(id: string, data: Partial<CouponInput>, token: string) {
  return apiFetch<Coupon>(`/coupons/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

export function deleteCoupon(id: string, token: string) {
  return apiFetch(`/coupons/${id}`, { method: "DELETE", headers: authHeaders(token) });
}

export async function applyCoupon(
  code: string,
  items: { productId: string; quantity: number }[],
): Promise<{ subtotal: number; discountAmount: number; total: number }> {
  return apiFetch("/coupons/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, items }),
  });
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
  newsletterOptIn?: boolean;
  couponCode?: string;
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

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED";

// Estados que significam "o pagamento foi cobrado" — uma encomenda paga
// continua a contar para totais/estatísticas mesmo depois de avançar para
// preparação/envio/entrega.
export const PAID_LIKE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export type Order = {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  street?: string;
  streetNumber?: string;
  floor?: string | null;
  postalCode?: string;
  city?: string;
  subtotal?: string;
  discountAmount?: string | null;
  couponCode?: string | null;
  total: string;
  createdAt: string;
  trackingCarrier?: string | null;
  trackingCode?: string | null;
  reminderSentAt?: string | null;
  items: { id: string; productName: string; unitPrice: string; quantity: number }[];
  giftCards?: { code: string; value: string; recipientEmail: string | null; message: string | null }[];
};

export function updateOrderStatus(
  id: string,
  data: { status?: OrderStatus; trackingCarrier?: string; trackingCode?: string },
  token: string,
): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data) });
}

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

export function getAbandonedCarts(token: string): Promise<Order[]> {
  return apiFetch<Order[]>("/orders/abandoned", { headers: { Authorization: `Bearer ${token}` } });
}

export function sendCartReminder(
  id: string,
  token: string,
): Promise<{ sent: boolean; reason?: "not_configured" | "provider_error" }> {
  return apiFetch(`/orders/${id}/remind`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
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

// --- Verificação em duas etapas (2FA) ---

export function getMfaStatus(token: string): Promise<{ enabled: boolean; recoveryCodesRemaining: number }> {
  return apiFetch("/auth/mfa/status", { headers: { Authorization: `Bearer ${token}` } });
}

export function setupMfa(token: string): Promise<{ secret: string; otpauthUrl: string }> {
  return apiFetch("/auth/mfa/setup", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

export function enableMfa(code: string, token: string): Promise<{ recoveryCodes: string[] }> {
  return apiFetch("/auth/mfa/enable", { method: "POST", headers: authHeaders(token), body: JSON.stringify({ code }) });
}

export function disableMfa(password: string, token: string): Promise<{ ok: boolean }> {
  return apiFetch("/auth/mfa/disable", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ password }),
  });
}

// Confirmação de ações críticas: reintroduzir a password (+ código MFA, se
// ativo) devolve um token de curta duração exigido por essas ações.
export function reauthVerify(password: string, code: string | undefined, token: string): Promise<{ reauthToken: string }> {
  return apiFetch("/auth/reauth", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ password, code }),
  });
}

// --- Sugestões / Mensagens / RMA ---

export type ContactType = "SUGGESTION" | "MESSAGE" | "RMA" | "QUOTE";

export type ContactReply = {
  id: string;
  body: string;
  fromAdmin: boolean;
  createdAt: string;
};

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
  replies: ContactReply[];
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
  return apiFetch(`/contact/${id}/replies`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ reply }),
  });
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

// --- Dashboard (admin) ---

export type SalesMetric = { total: number; count: number; averageTicket: number };

export type DashboardSummary = {
  sales: {
    today: SalesMetric;
    prevDay: SalesMetric;
    month: SalesMetric;
    prevMonth: SalesMetric;
    year: SalesMetric;
    prevYear: SalesMetric;
  };
  newCustomersThisMonth: number;
  recurringCustomers: number;
  loyalty: { recurring: number; oneTime: number };
  abandonedCarts: number;
  stock: {
    outOfStock: number;
    critical: number;
    criticalList: { id: string; name: string; slug: string; stockQuantity: number }[];
  };
  topProducts: { productId: string; productName: string; quantity: number }[];
  topCustomers: { customerId: string; name: string | null; email: string; total: number; orderCount: number }[];
  dailyStats: { date: string; total: number; count: number; averageTicket: number; visits: number }[];
  hourlyActivity: { hour: number; visits: number; salesCount: number; salesTotal: number }[];
  salesByWeekday: { weekday: string; total: number; count: number }[];
  revenueByCategory: { category: string; total: number }[];
  newCustomersOverTime: { date: string; count: number }[];
  topCities: { city: string; orderCount: number; total: number }[];
  giftCardStats: { activeCount: number; activeValue: number; redeemedCount: number; redeemedValue: number };
  paymentMethods: { method: string; count: number }[];
  support: { total: number; responded: number; avgResponseHours: number | null };
  conversionRate: number | null;
};

export function getDashboardSummary(token: string): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary", { headers: { Authorization: `Bearer ${token}` } });
}

// --- Clientes (admin) ---

export type AdminCustomer = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  totalSpent: number;
  orderCount: number;
  lastOrderAt: string | null;
};

export type AdminCustomerDetail = {
  customer: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    addresses: Address[];
  };
  orders: Order[];
};

export function getAdminCustomers(token: string): Promise<AdminCustomer[]> {
  return apiFetch<AdminCustomer[]>("/users", { headers: { Authorization: `Bearer ${token}` } });
}

export function getAdminCustomerDetail(id: string, token: string): Promise<AdminCustomerDetail> {
  return apiFetch<AdminCustomerDetail>(`/users/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
