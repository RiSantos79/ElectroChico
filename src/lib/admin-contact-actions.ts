"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { replyContactMessage } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export async function replyMessageAction(id: string, formData: FormData) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const reply = String(formData.get("reply") || "");
  if (!reply.trim()) return;

  await replyContactMessage(id, reply, token);
  revalidatePath("/admin/mensagens");
}
