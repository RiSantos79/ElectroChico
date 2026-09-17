import type { AiCompletionRequest, AiCompletionResult, AiProviderAdapter, AiProviderConfig } from './types.js';
import { readErrorBody } from './types.js';

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

// OpenAI, Azure OpenAI, OpenRouter, Ollama e Copilot expõem todos o mesmo
// formato `/chat/completions` — muda só o endereço base e o cabeçalho de
// autenticação, por isso um único adaptador cobre os cinco.
export class OpenAiCompatibleProvider implements AiProviderAdapter {
  constructor(
    readonly label: string,
    readonly defaultModel: string,
    readonly defaultBaseUrl: string,
    readonly requiresApiKey = true,
  ) {}

  async complete(config: AiProviderConfig, request: AiCompletionRequest): Promise<AiCompletionResult> {
    const baseUrl = (config.baseUrl || this.defaultBaseUrl).replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        max_tokens: request.maxTokens ?? 1200,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`${this.label} respondeu ${response.status}: ${await readErrorBody(response)}`);
    }

    const data = (await response.json()) as ChatResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error(`${this.label} devolveu uma resposta vazia`);

    return {
      text,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
  }
}
