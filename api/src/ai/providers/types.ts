export type AiCompletionResult = {
  text: string;
  promptTokens: number;
  completionTokens: number;
};

export type AiProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export type AiCompletionRequest = {
  system: string;
  prompt: string;
  maxTokens?: number;
};

// Cada fornecedor só precisa de saber falar com a sua API. Tudo o resto
// (chave cifrada, contagem de consumo, prompts, permissões) vive fora daqui,
// para trocar de fornecedor nunca implicar mexer no resto da aplicação.
export interface AiProviderAdapter {
  readonly label: string;
  readonly defaultModel: string;
  readonly defaultBaseUrl?: string;
  /** Ollama corre local e não usa chave — os restantes exigem-na. */
  readonly requiresApiKey: boolean;
  complete(config: AiProviderConfig, request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 400);
  } catch {
    return '';
  }
}
