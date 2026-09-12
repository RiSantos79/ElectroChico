"use server";

import { redirect } from "next/navigation";
import { getGiftCard, redeemGiftCard, type GiftCard } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

async function requireToken() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");
  return token;
}

export async function lookupGiftCardAction(code: string): Promise<GiftCard | null> {
  const token = await requireToken();
  return getGiftCard(code, token);
}

export async function redeemGiftCardAction(code: string): Promise<GiftCard | { error: string }> {
  const token = await requireToken();
  try {
    return await redeemGiftCard(code, token);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível resgatar o cartão." };
  }
}
