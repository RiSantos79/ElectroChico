"use server";

import { createOrder, type CreateOrderInput } from "@/lib/api";

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<{ checkoutUrl?: string; error?: string }> {
  try {
    const { checkoutUrl } = await createOrder(input);
    return { checkoutUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível criar a encomenda." };
  }
}
