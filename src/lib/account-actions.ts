"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  updateProfile,
  changePassword,
  type AddressInput,
} from "@/lib/api";
import { getCustomerSessionToken, setCustomerSessionCookie } from "@/lib/customer-session";

async function requireCustomerToken() {
  const token = await getCustomerSessionToken();
  if (!token) redirect("/conta");
  return token;
}

function addressInputFromForm(formData: FormData): AddressInput {
  return {
    label: String(formData.get("label") || "") || undefined,
    street: String(formData.get("street") || ""),
    streetNumber: String(formData.get("streetNumber") || ""),
    floor: String(formData.get("floor") || "") || undefined,
    postalCode: String(formData.get("postalCode") || ""),
    city: String(formData.get("city") || ""),
    phone: String(formData.get("phone") || "") || undefined,
    isDefault: formData.get("isDefault") === "on",
  };
}

export async function addAddressAction(formData: FormData) {
  const token = await requireCustomerToken();
  await createAddress(addressInputFromForm(formData), token);
  revalidatePath("/conta");
}

export async function updateAddressAction(id: string, formData: FormData) {
  const token = await requireCustomerToken();
  await updateAddress(id, addressInputFromForm(formData), token);
  revalidatePath("/conta");
}

export async function deleteAddressAction(id: string) {
  const token = await requireCustomerToken();
  await deleteAddress(id, token);
  revalidatePath("/conta");
}

export async function updateProfileAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const token = await requireCustomerToken();
  const name = String(formData.get("name") || "");
  try {
    const { accessToken } = await updateProfile(name, token);
    await setCustomerSessionCookie(accessToken);
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível guardar o nome.";
  }
  revalidatePath("/conta");
  return null;
}

export type ChangePasswordResult = { ok: boolean; message: string } | null;

export async function changePasswordAction(
  _prevState: ChangePasswordResult,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const token = await requireCustomerToken();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword !== confirmPassword) return { ok: false, message: "As novas palavras-passe não coincidem." };

  try {
    await changePassword(currentPassword, newPassword, token);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Não foi possível alterar a palavra-passe." };
  }
  return { ok: true, message: "Palavra-passe alterada com sucesso." };
}
