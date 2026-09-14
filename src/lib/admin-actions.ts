"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createBrand,
  createCoupon,
  createProduct,
  deleteCoupon,
  deleteProduct,
  duplicateProduct,
  sendCartReminder,
  updateBrand,
  updateCategory,
  updateContentPage,
  updateCoupon,
  updateOrderStatus,
  updateProduct,
  updateSiteSettings,
  uploadImage,
  type AdminProductInput,
  type CouponInput,
  type OrderStatus,
  type SiteSettings,
} from "@/lib/api";
import { getSessionToken } from "@/lib/session";

async function requireToken() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");
  return token;
}

// Aceita tanto "Nome: Valor" escrito à mão como texto colado de uma tabela
// ou folha de cálculo (colunas separadas por tab) — nesse caso ignora um
// ":" a mais que normalmente sobra no fim da célula do valor.
function parseSpecs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.includes("\t")) {
        const [label, ...rest] = line.split("\t");
        return { label: label.trim(), value: rest.join("\t").trim().replace(/:\s*$/, "") };
      }
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), value: rest.join(":").trim() };
    });
}

function optionalNumber(formData: FormData, key: string): number | undefined {
  const raw = formData.get(key);
  if (!raw || raw === "") return undefined;
  return Number(raw);
}

function optionalString(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  return raw ? String(raw) : undefined;
}

async function formToInput(formData: FormData, token: string): Promise<AdminProductInput> {
  const oldPrice = formData.get("oldPrice");
  const badge = formData.get("badge");

  const existingImages = String(formData.get("existingImages") || "")
    .split(",")
    .filter(Boolean);
  const imagesToRemove = new Set(formData.getAll("removeImages").map(String));
  const keptImages = existingImages.filter((url) => !imagesToRemove.has(url));

  const newFiles = formData.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  const uploadedUrls = await Promise.all(newFiles.map((file) => uploadImage(file, token)));

  return {
    slug: String(formData.get("slug")),
    name: String(formData.get("name")),
    brandId: String(formData.get("brandId")),
    categoryId: String(formData.get("categoryId")),
    price: Number(formData.get("price")),
    oldPrice: oldPrice ? Number(oldPrice) : undefined,
    energyClass: String(formData.get("energyClass")) as AdminProductInput["energyClass"],
    stockQuantity: Number(formData.get("stockQuantity") || 0),
    badge: badge ? (String(badge) as AdminProductInput["badge"]) : undefined,
    color: String(formData.get("color") || "#1f2937"),
    images: [...keptImages, ...uploadedUrls],
    description: String(formData.get("description")),
    specs: parseSpecs(String(formData.get("specs") || "")),
    sku: optionalString(formData, "sku"),
    ean: optionalString(formData, "ean"),
    weightKg: optionalNumber(formData, "weightKg"),
    widthCm: optionalNumber(formData, "widthCm"),
    heightCm: optionalNumber(formData, "heightCm"),
    depthCm: optionalNumber(formData, "depthCm"),
    warrantyMonths: optionalNumber(formData, "warrantyMonths"),
    archived: formData.get("archived") === "on",
    metaTitle: optionalString(formData, "metaTitle"),
    metaDescription: optionalString(formData, "metaDescription"),
  };
}

export async function createProductAction(formData: FormData) {
  const token = await requireToken();
  await createProduct(await formToInput(formData, token), token);
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  redirect("/admin/produtos");
}

export async function updateProductAction(id: string, formData: FormData) {
  const token = await requireToken();
  await updateProduct(id, await formToInput(formData, token), token);
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  redirect("/admin/produtos");
}

export async function deleteProductAction(id: string) {
  const token = await requireToken();
  await deleteProduct(id, token);
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
}

export async function duplicateProductAction(id: string) {
  const token = await requireToken();
  const copy = await duplicateProduct(id, token);
  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${copy.id}/editar`);
}

async function uploadedLogoUrl(formData: FormData, token: string): Promise<string | undefined> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return undefined;
  return uploadImage(file, token);
}

export async function createBrandAction(formData: FormData) {
  const token = await requireToken();
  await createBrand(
    { name: String(formData.get("name")), logoUrl: await uploadedLogoUrl(formData, token) },
    token,
  );
  revalidatePath("/admin/marcas");
}

export async function updateBrandAction(id: string, formData: FormData) {
  const token = await requireToken();
  const logoUrl = await uploadedLogoUrl(formData, token);
  await updateBrand(id, { name: String(formData.get("name")), ...(logoUrl ? { logoUrl } : {}) }, token);
  revalidatePath("/admin/marcas");
}

export async function updateCategoryImageAction(id: string, formData: FormData) {
  const token = await requireToken();
  const logoUrl = await uploadedLogoUrl(formData, token);
  if (logoUrl) await updateCategory(id, { imageUrl: logoUrl }, token);
  revalidatePath("/admin/categorias");
}

export async function updateOrderAction(id: string, formData: FormData) {
  const token = await requireToken();
  await updateOrderStatus(
    id,
    {
      status: String(formData.get("status")) as OrderStatus,
      trackingCarrier: optionalString(formData, "trackingCarrier"),
      trackingCode: optionalString(formData, "trackingCode"),
    },
    token,
  );
  revalidatePath("/admin/encomendas");
  revalidatePath(`/admin/encomendas/${id}`);
}

function isoOrUndefined(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  return raw ? new Date(String(raw)).toISOString() : undefined;
}

export async function createCouponAction(formData: FormData) {
  const token = await requireToken();
  const input: CouponInput = {
    code: String(formData.get("code")),
    type: String(formData.get("type")) as CouponInput["type"],
    value: Number(formData.get("value")),
    minOrderValue: optionalNumber(formData, "minOrderValue"),
    maxUses: optionalNumber(formData, "maxUses"),
    validFrom: isoOrUndefined(formData, "validFrom"),
    validUntil: isoOrUndefined(formData, "validUntil"),
  };
  await createCoupon(input, token);
  revalidatePath("/admin/cupoes");
}

export async function toggleCouponAction(id: string, active: boolean) {
  const token = await requireToken();
  await updateCoupon(id, { active }, token);
  revalidatePath("/admin/cupoes");
}

export async function deleteCouponAction(id: string) {
  const token = await requireToken();
  await deleteCoupon(id, token);
  revalidatePath("/admin/cupoes");
}

export async function sendReminderAction(id: string) {
  const token = await requireToken();
  const result = await sendCartReminder(id, token);
  revalidatePath("/admin/carrinhos-abandonados");
  redirect(`/admin/carrinhos-abandonados?resultado=${result.sent ? "enviado" : "nao-configurado"}`);
}

export async function updateSiteSettingsAction(formData: FormData) {
  const token = await requireToken();
  const fields: (keyof SiteSettings)[] = [
    "companyName",
    "taxId",
    "address",
    "phone",
    "email",
    "facebookUrl",
    "instagramUrl",
    "copyrightText",
    "trustBadge1Title",
    "trustBadge1Desc",
    "trustBadge2Title",
    "trustBadge2Desc",
    "trustBadge3Title",
    "trustBadge3Desc",
    "trustBadge4Title",
    "trustBadge4Desc",
  ];
  const data: Partial<SiteSettings> = {};
  for (const field of fields) {
    data[field] = String(formData.get(field) ?? "");
  }
  await updateSiteSettings(data, token);
  revalidatePath("/admin/definicoes");
  revalidatePath("/");
}

export async function updateContentPageAction(slug: string, formData: FormData) {
  const token = await requireToken();
  await updateContentPage(
    slug,
    { title: String(formData.get("title") ?? ""), body: String(formData.get("body") ?? "") },
    token,
  );
  revalidatePath("/admin/conteudos");
  revalidatePath(`/${slug}`);
  redirect("/admin/conteudos");
}
