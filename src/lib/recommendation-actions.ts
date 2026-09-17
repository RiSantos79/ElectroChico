"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateRecommendationSettings } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export async function updateRecommendationSettingsAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await getSessionToken();
    if (!token) redirect("/admin/login");

    const mlApiKey = String(formData.get("mlApiKey") ?? "").trim();
    await updateRecommendationSettings(
      {
        strategy: formData.get("strategy") === "ML" ? "ML" : "RULES",
        limit: Number(formData.get("limit") ?? 4),
        preferSameBrand: formData.get("preferSameBrand") === "on",
        priceTolerancePct: Number(formData.get("priceTolerancePct") ?? 40),
        useCoPurchase: formData.get("useCoPurchase") === "on",
        mlEndpoint: String(formData.get("mlEndpoint") ?? "").trim(),
        ...(mlApiKey ? { mlApiKey } : {}),
      },
      token,
    );
    revalidatePath("/admin/definicoes/recomendacoes");
    revalidatePath("/produto", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Não foi possível guardar as regras." };
  }
}
