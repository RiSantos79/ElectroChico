"use server";

import { applyCoupon, createOrder, type CreateOrderInput } from "@/lib/api";
import { getCustomerSessionToken } from "@/lib/customer-session";

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<{ checkoutUrl?: string; error?: string }> {
  try {
    const customerToken = await getCustomerSessionToken();
    const { checkoutUrl } = await createOrder(input, customerToken);
    return { checkoutUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível criar a encomenda." };
  }
}

export async function applyCouponAction(
  code: string,
  items: { productId: string; quantity: number }[],
): Promise<{ discountAmount?: number; total?: number; error?: string }> {
  try {
    const { discountAmount, total } = await applyCoupon(code, items);
    return { discountAmount, total };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível aplicar o código." };
  }
}
