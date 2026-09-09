"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export function ClearCartOnMount() {
  const { clear } = useCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => clear(), []);
  return null;
}
