"use server";

import { decodeJwt } from "jose";
import { revalidatePath } from "next/cache";
import { createContactMessage, replyContactMessage, type ContactMessageInput } from "@/lib/api";
import { getCustomerSessionToken } from "@/lib/customer-session";

const pathByType: Record<"MESSAGE" | "SUGGESTION", string> = {
  MESSAGE: "/conta/mensagens",
  SUGGESTION: "/sugestoes",
};

// Sugestões e Mensagens são o mesmo formulário (assunto + corpo, cliente
// autenticado) — só muda o tipo gravado e para onde a página revalida.
export async function sendContactThreadAction(
  type: "MESSAGE" | "SUGGESTION",
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await getCustomerSessionToken();
  if (!token) return "Tem de iniciar sessão para continuar.";
  const { name, email } = decodeJwt<{ name?: string | null; email: string }>(token);

  try {
    await createContactMessage(
      {
        type,
        name: name || email,
        email,
        subject: String(formData.get("subject") || "") || undefined,
        body: String(formData.get("body") || ""),
      },
      token,
    );
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar.";
  }
  revalidatePath(pathByType[type]);
  return "ok";
}

// Usado tanto em /conta/mensagens como em /conta/rma — o path a revalidar
// vem preso (bind) no lado do cliente, tal como o id da conversa.
export async function sendCustomerReplyAction(
  path: string,
  id: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const token = await getCustomerSessionToken();
  if (!token) return "Tem de iniciar sessão para continuar.";

  const reply = String(formData.get("reply") || "");
  if (!reply.trim()) return null;

  try {
    await replyContactMessage(id, reply, token);
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar a resposta.";
  }
  revalidatePath(path);
  return "ok";
}

// Contacto e Pedido de Orçamento são páginas públicas — qualquer visitante
// tem de conseguir usá-las sem conta, ao contrário de Sugestões/Mensagens/RMA.
export async function sendPublicContactAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await createContactMessage({
      type: "MESSAGE",
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || "") || undefined,
      body: String(formData.get("body") || ""),
    });
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar a mensagem.";
  }
  return "ok";
}

export async function sendQuoteRequestAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await createContactMessage({
      type: "QUOTE",
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || "") || undefined,
      subject: String(formData.get("category") || "") || undefined,
      body: String(formData.get("body") || ""),
    });
  } catch (e) {
    return e instanceof Error ? e.message : "Não foi possível enviar o pedido.";
  }
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
