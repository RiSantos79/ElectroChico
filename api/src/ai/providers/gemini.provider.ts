import type { AiCompletionRequest, AiCompletionResult, AiProviderAdapter, AiProviderConfig } from './types.js';
import { readErrorBody } from './types.js';

type GenerateContentResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

export class GeminiProvider implements AiProviderAdapter {
  readonly label = 'Google Gemini';
  readonly defaultModel = 'gemini-2.0-flash';
  readonly defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  readonly requiresApiKey = true;

  async complete(config: AiProviderConfig, request: AiCompletionRequest): Promise<AiCompletionResult> {
    const baseUrl = (config.baseUrl || this.defaultBaseUrl).replace(/\/$/, '');
    const model = config.model || this.defaultModel;
    const response = await fetch(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.system }] },
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: { maxOutputTokens: request.maxTokens ?? 1200 },
      }),
    });

    if (!response.ok) {
      throw new Error(`${this.label} respondeu ${response.status}: ${await readErrorBody(response)}`);
    }

    const data = (await response.json()) as GenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) throw new Error(`${this.label} devolveu uma resposta vazia`);

    return {
      text,
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}
