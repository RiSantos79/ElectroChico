import type { AiProvider } from '../../generated/prisma/client.js';
import type { AiProviderAdapter } from './types.js';
import { OpenAiCompatibleProvider } from './openai-compatible.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { GeminiProvider } from './gemini.provider.js';

// Registo dos fornecedores. Acrescentar um novo é acrescentar uma linha aqui
// (e o valor no enum do Prisma) — nada no resto da aplicação muda.
const REGISTRY: Record<AiProvider, AiProviderAdapter> = {
  OPENAI: new OpenAiCompatibleProvider('OpenAI', 'gpt-4o-mini', 'https://api.openai.com/v1'),
  AZURE_OPENAI: new OpenAiCompatibleProvider('Azure OpenAI', 'gpt-4o-mini', 'https://YOUR-RESOURCE.openai.azure.com/openai/v1'),
  ANTHROPIC: new AnthropicProvider(),
  GEMINI: new GeminiProvider(),
  OLLAMA: new OpenAiCompatibleProvider('Ollama (local)', 'llama3.1', 'http://localhost:11434/v1', false),
  OPENROUTER: new OpenAiCompatibleProvider('OpenRouter', 'openai/gpt-4o-mini', 'https://openrouter.ai/api/v1'),
  COPILOT: new OpenAiCompatibleProvider('Microsoft Copilot', 'gpt-4o-mini', 'https://api.githubcopilot.com'),
};

export function providerAdapter(provider: AiProvider): AiProviderAdapter {
  return REGISTRY[provider];
}

export function providerCatalogue() {
  return (Object.keys(REGISTRY) as AiProvider[]).map((value) => ({
    value,
    label: REGISTRY[value].label,
    defaultModel: REGISTRY[value].defaultModel,
    defaultBaseUrl: REGISTRY[value].defaultBaseUrl,
    requiresApiKey: REGISTRY[value].requiresApiKey,
  }));
}

export type { AiProviderAdapter } from './types.js';
