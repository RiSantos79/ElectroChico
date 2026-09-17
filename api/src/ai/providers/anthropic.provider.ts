import type { AiCompletionRequest, AiCompletionResult, AiProviderAdapter, AiProviderConfig } from './types.js';
import { readErrorBody } from './types.js';

type MessagesResponse = {
  content?: { type?: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
};

export class AnthropicProvider implements AiProviderAdapter {
  readonly label = 'Anthropic Claude';
  readonly defaultModel = 'claude-sonnet-5';
  readonly defaultBaseUrl = 'https://api.anthropic.com/v1';
  readonly requiresApiKey = true;

  async complete(config: AiProviderConfig, request: AiCompletionRequest): Promise<AiCompletionResult> {
    const baseUrl = (config.baseUrl || this.defaultBaseUrl).replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        max_tokens: request.maxTokens ?? 1200,
        system: request.system,
        messages: [{ role: 'user', content: request.prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`${this.label} respondeu ${response.status}: ${await readErrorBody(response)}`);
    }

    const data = (await response.json()) as MessagesResponse;
    const text = data.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
      .trim();
    if (!text) throw new Error(`${this.label} devolveu uma resposta vazia`);

    return {
      text,
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
    };
  }
}
