"use server";

import { revalidatePath } from "next/cache";
import { submitReview } from "@/lib/api";

export async function submitReviewAction(
  productId: string,
  productSlug: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const authorName = String(formData.get("authorName") || "").trim();
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") || "").trim();

  if (!authorName) return "Indica o teu nome.";
  if (!rating || rating < 1 || rating > 5) return "Escolhe uma classificação de 1 a 5.";

  await submitReview(productId, { authorName, rating, comment: comment || undefined });
  revalidatePath(`/produto/${productSlug}`);
  return "done";
}
