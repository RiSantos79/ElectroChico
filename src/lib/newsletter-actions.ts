"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createNewsletterCampaign,
  deleteNewsletterCampaign,
  sendNewsletterCampaign,
  unsubscribeNewsletter,
} from "@/lib/api";
import { getSessionToken } from "@/lib/session";

async function requireToken() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");
  return token;
}

export async function unsubscribeAction(id: string) {
  const token = await requireToken();
  await unsubscribeNewsletter(id, token);
  revalidatePath("/admin/newsletter");
}

export async function createCampaignAction(formData: FormData) {
  const token = await requireToken();
  await createNewsletterCampaign(
    { subject: String(formData.get("subject") ?? ""), body: String(formData.get("body") ?? "") },
    token,
  );
  revalidatePath("/admin/newsletter");
}

export async function deleteCampaignAction(id: string) {
  const token = await requireToken();
  await deleteNewsletterCampaign(id, token);
  revalidatePath("/admin/newsletter");
}

export async function sendCampaignAction(id: string) {
  const token = await requireToken();
  const result = await sendNewsletterCampaign(id, token);
  revalidatePath("/admin/newsletter");
  redirect(`/admin/newsletter?resultado=${result.sent ? `enviado-${result.sentCount}` : "nao-configurado"}`);
}
