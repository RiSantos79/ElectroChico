"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getMarketingGroups,
  removeMarketingKey,
  syncMarketingContacts,
  updateMarketingSettings,
} from "@/lib/api";
import { getSessionToken } from "@/lib/session";

async function requireToken() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");
  return token;
}

function message(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export async function updateMarketingSettingsAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const apiKey = String(formData.get("apiKey") ?? "").trim();
    await updateMarketingSettings(
      {
        enabled: formData.get("enabled") === "on",
        groupId: String(formData.get("groupId") ?? "").trim(),
        // Campo vazio mantém a chave já guardada.
        ...(apiKey ? { apiKey } : {}),
      },
      token,
    );
    revalidatePath("/admin/definicoes/marketing");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Não foi possível guardar a configuração.") };
  }
}

export async function removeMarketingKeyAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await removeMarketingKey(token);
    revalidatePath("/admin/definicoes/marketing");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Não foi possível remover a chave.") };
  }
}

// Listar grupos serve de teste de ligação: só uma chave válida os devolve.
export async function testMarketingConnectionAction() {
  try {
    const token = await requireToken();
    return await getMarketingGroups(token);
  } catch (e) {
    return { ok: false as const, error: message(e, "Não foi possível contactar o Sender.") };
  }
}

export async function syncMarketingContactsAction() {
  try {
    const token = await requireToken();
    const result = await syncMarketingContacts(token);
    revalidatePath("/admin/definicoes/marketing");
    return result;
  } catch (e) {
    return { ok: false as const, error: message(e, "A sincronização falhou.") };
  }
}
