"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  uploadImage,
  type AdminProductInput,
} from "@/lib/api";
import { getSessionToken } from "@/lib/session";

async function requireToken() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");
  return token;
}

function parseSpecs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), value: rest.join(":").trim() };
    });
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
    brand: String(formData.get("brand")),
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
