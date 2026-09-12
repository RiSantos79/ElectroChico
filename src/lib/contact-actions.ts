"use server";

import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { createContactMessage, type ContactMessageInput } from "@/lib/api";
import { getCustomerSessionToken } from "@/lib/customer-session";

export async function sendSuggestionAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  try {
    await createContactMessage({
      type: "SUGGESTION",
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || "") || undefined,
      subject: String(formData.get("subject") || "") || undefined,
      body: String(formData.get("body") || ""),
    });
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar a sugestão.";
  }
  return "ok";
}

export async function sendMessageAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const token = await getCustomerSessionToken();
  if (!token) return "Tem de iniciar sessão para enviar uma mensagem.";
  const { name, email } = decodeJwt<{ name?: string | null; email: string }>(token);

  try {
    await createContactMessage(
      {
        type: "MESSAGE",
        name: name || email,
        email,
        subject: String(formData.get("subject") || "") || undefined,
        body: String(formData.get("body") || ""),
      },
      token,
    );
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar a mensagem.";
  }
  revalidatePath("/conta/mensagens");
  return "ok";
}

export async function sendRmaAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const token = await getCustomerSessionToken();
  if (!token) return "Tem de iniciar sessão para pedir uma devolução/RMA.";
  const { name, email } = decodeJwt<{ name?: string | null; email: string }>(token);

  try {
    const input: ContactMessageInput = {
      type: "RMA",
      name: name || email,
      email,
      orderId: String(formData.get("orderId") || "") || undefined,
      productName: String(formData.get("productName") || "") || undefined,
      body: String(formData.get("body") || ""),
    };
    await createContactMessage(input, token);
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar o pedido de RMA.";
  }
  revalidatePath("/conta/rma");
  return "ok";
}
