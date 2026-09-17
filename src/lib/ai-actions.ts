"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  aiAssistant,
  aiGenerate,
  removeAiKey,
  testAiConnection,
  updateAiSettings,
  type AiFeatureKey,
  type AiProviderKey,
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

export async function updateAiSettingsAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const apiKey = String(formData.get("apiKey") ?? "").trim();
    await updateAiSettings(
      {
        enabled: formData.get("enabled") === "on",
        provider: String(formData.get("provider")) as AiProviderKey,
        model: String(formData.get("model") ?? "").trim(),
        baseUrl: String(formData.get("baseUrl") ?? "").trim(),
        // Campo vazio mantém a chave já guardada.
        ...(apiKey ? { apiKey } : {}),
      },
      token,
    );
    revalidatePath("/admin/definicoes/ia");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Não foi possível guardar as definições de IA.") };
  }
}

export async function removeAiKeyAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    await removeAiKey(token);
    revalidatePath("/admin/definicoes/ia");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Não foi possível remover a chave.") };
  }
}

export async function testAiConnectionAction(): Promise<{ ok: boolean; message: string }> {
  try {
    const token = await requireToken();
    return await testAiConnection(token);
  } catch (e) {
    return { ok: false, message: message(e, "Não foi possível testar a ligação.") };
  }
}

export async function aiGenerateAction(
  feature: AiFeatureKey,
  context: Record<string, string>,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const { text } = await aiGenerate(feature, context, token);
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: message(e, "A geração falhou.") };
  }
}

export async function aiAssistantAction(
  question: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const token = await requireToken();
    const { text } = await aiAssistant(question, token);
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: message(e, "O assistente não conseguiu responder.") };
  }
}
