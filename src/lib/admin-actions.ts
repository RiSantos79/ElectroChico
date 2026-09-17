"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ACTIONS,
  bulkImportProducts,
  bulkPriceChange,
  createBanner,
  createBrand,
  createCoupon,
  createProduct,
  createStaff,
  deleteBanner,
  deleteCoupon,
  deleteProduct,
  deleteProducts,
  deleteStaff,
  deleteStaffs,
  duplicateProduct,
  forceStaffLogout,
  forceStaffPasswordReset,
  getBannersAdmin,
  MODULES,
  reauthVerify,
  revokeMySession,
  revokeOtherSessions,
  sendCartReminder,
  updateBanner,
  updateBrand,
  updateCategory,
  updateContentPage,
  updateCoupon,
  updateOrderStatus,
  updateProduct,
  updateSiteSettings,
  updateStaff,
  updateStaffPermissions,
  updateStaffStatus,
  uploadImage,
  type Action,
  type AdminProductInput,
  type BannerInput,
  type BulkImportProductRow,
  type BulkImportResult,
  type CouponInput,
  type OrderStatus,
  type PermissionMatrix,
  type Role,
  type SiteSettings,
  type UserStatus,
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

// Uma pergunta por linha, no formato "Pergunta | Resposta" (também aceita
// tab, para colar de uma folha de cálculo com duas colunas).
function parseFaqs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes("\t") ? "\t" : "|";
      const [question, ...rest] = line.split(sep);
      return { question: question.trim(), answer: rest.join(sep).trim() };
    })
    .filter((faq) => faq.question && faq.answer);
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
    faqs: parseFaqs(String(formData.get("faqs") || "")),
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

export async function deleteProductAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await deleteProduct(id, token);
    revalidatePath("/admin/produtos");
    revalidatePath("/catalogo");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível apagar o produto." };
  }
}

export async function deleteProductsAction(ids: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await deleteProducts(ids, token);
    revalidatePath("/admin/produtos");
    revalidatePath("/catalogo");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível apagar os produtos selecionados." };
  }
}

export async function bulkPriceChangeAction(
  ids: string[],
  amount: number,
  reauthToken?: string,
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const result = await bulkPriceChange(ids, amount, token, reauthToken);
    revalidatePath("/admin/produtos");
    revalidatePath("/catalogo");
    return { ok: true, updated: result.updated };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível alterar os preços." };
  }
}

export async function bulkImportProductsAction(
  rows: BulkImportProductRow[],
): Promise<{ ok: true; result: BulkImportResult } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const result = await bulkImportProducts(rows, token);
    revalidatePath("/admin/produtos");
    revalidatePath("/catalogo");
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível importar os produtos." };
  }
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

export async function updateOrderAction(
  id: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
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
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível guardar a encomenda." };
  }
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

async function uploadedBannerImageUrl(formData: FormData, token: string): Promise<string | undefined> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return undefined;
  return uploadImage(file, token);
}

export async function createBannerAction(formData: FormData) {
  const token = await requireToken();
  const imageUrl = await uploadedBannerImageUrl(formData, token);
  const input: BannerInput = {
    size: String(formData.get("size")) as BannerInput["size"],
    title: String(formData.get("title")),
    linkUrl: String(formData.get("linkUrl")),
    eyebrow: optionalString(formData, "eyebrow"),
    description: optionalString(formData, "description"),
    ctaLabel: optionalString(formData, "ctaLabel"),
    imageUrl,
  };
  await createBanner(input, token);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function updateBannerAction(id: string, formData: FormData) {
  const token = await requireToken();
  const imageUrl = await uploadedBannerImageUrl(formData, token);
  await updateBanner(
    id,
    {
      size: String(formData.get("size")) as BannerInput["size"],
      title: String(formData.get("title")),
      linkUrl: String(formData.get("linkUrl")),
      eyebrow: optionalString(formData, "eyebrow"),
      description: optionalString(formData, "description"),
      ctaLabel: optionalString(formData, "ctaLabel"),
      ...(imageUrl ? { imageUrl } : {}),
    },
    token,
  );
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function toggleBannerAction(id: string, active: boolean) {
  const token = await requireToken();
  await updateBanner(id, { active }, token);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBannerAction(id: string) {
  const token = await requireToken();
  await deleteBanner(id, token);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function moveBannerAction(id: string, direction: "up" | "down") {
  const token = await requireToken();
  const banners = await getBannersAdmin(token);
  const index = banners.findIndex((b) => b.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= banners.length) return;
  await Promise.all([
    updateBanner(banners[index].id, { order: banners[swapWith].order }, token),
    updateBanner(banners[swapWith].id, { order: banners[index].order }, token),
  ]);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function createStaffAction(
  formData: FormData,
  reauthToken?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await createStaff(
      {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        name: String(formData.get("name") ?? ""),
        phone: optionalString(formData, "phone"),
        jobTitle: optionalString(formData, "jobTitle"),
        role: String(formData.get("role")) as Role,
      },
      token,
      reauthToken,
    );
    revalidatePath("/admin/utilizadores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível criar o funcionário." };
  }
}

export async function updateStaffAction(
  id: string,
  formData: FormData,
  reauthToken?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await updateStaff(
      id,
      {
        name: String(formData.get("name") ?? ""),
        phone: optionalString(formData, "phone"),
        jobTitle: optionalString(formData, "jobTitle"),
        role: String(formData.get("role")) as Role,
      },
      token,
      reauthToken,
    );
    revalidatePath("/admin/utilizadores");
    revalidatePath(`/admin/utilizadores/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível guardar as alterações." };
  }
}

export async function updateStaffStatusAction(id: string, status: UserStatus) {
  const token = await requireToken();
  await updateStaffStatus(id, status, token);
  revalidatePath("/admin/utilizadores");
}

export async function forceStaffLogoutAction(id: string) {
  const token = await requireToken();
  await forceStaffLogout(id, token);
  revalidatePath("/admin/utilizadores");
}

export async function forceStaffPasswordResetAction(id: string) {
  const token = await requireToken();
  const { tempPassword } = await forceStaffPasswordReset(id, token);
  revalidatePath("/admin/utilizadores");
  redirect(`/admin/utilizadores/${id}?tempPassword=${encodeURIComponent(tempPassword)}`);
}

export async function deleteStaffAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await deleteStaff(id, token);
    revalidatePath("/admin/utilizadores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível apagar o funcionário." };
  }
}

export async function deleteStaffsAction(ids: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await deleteStaffs(ids, token);
    revalidatePath("/admin/utilizadores");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível apagar os funcionários selecionados." };
  }
}

export async function updateStaffPermissionsAction(
  id: string,
  formData: FormData,
  reauthToken?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const overrides = {} as PermissionMatrix;
    for (const moduleKey of MODULES) {
      overrides[moduleKey] = {} as Record<Action, boolean>;
      for (const action of ACTIONS) {
        overrides[moduleKey][action] = formData.get(`perm_${moduleKey}_${action}`) === "on";
      }
    }
    await updateStaffPermissions(id, overrides, token, reauthToken);
    revalidatePath("/admin/utilizadores");
    revalidatePath(`/admin/utilizadores/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível guardar as permissões." };
  }
}

export async function resetStaffPermissionsAction(
  id: string,
  reauthToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await updateStaffPermissions(id, null, token, reauthToken);
    revalidatePath("/admin/utilizadores");
    revalidatePath(`/admin/utilizadores/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível repor as permissões." };
  }
}

export async function verifyReauthAction(
  password: string,
  code?: string,
): Promise<{ ok: true; reauthToken: string } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const { reauthToken } = await reauthVerify(password, code, token);
    return { ok: true, reauthToken };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Confirmação falhou." };
  }
}

export async function revokeMySessionAction(id: string) {
  const token = await requireToken();
  await revokeMySession(id, token);
  revalidatePath("/admin/seguranca");
}

export async function revokeOtherSessionsAction() {
  const token = await requireToken();
  await revokeOtherSessions(token);
  revalidatePath("/admin/seguranca");
}
