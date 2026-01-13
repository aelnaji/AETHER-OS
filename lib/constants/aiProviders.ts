export interface AIProvider {
  id: string;
  name: string;
  endpoint: string;
  baseUrl?: string;
  models: string[];
  supportsTools: boolean;
  supportsStreaming: boolean;
  apiKeyRequired: boolean;
  documentationUrl?: string;
  icon?: string;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: [
      'meta/llama-3.1-405b-instruct',
      'meta/llama-3.1-70b-instruct',
      'mistralai/mistral-large',
      'qwen/qwen-1.5-32b-chat',
      'mistralai/mistral-7b-instruct-v0.1',
      'google/gemma-7b',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://build.nvidia.com/',
    icon: '🟢',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://platform.openai.com/docs/api-reference/chat',
    icon: '🤖',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://docs.anthropic.com/claude/reference/messages_post',
    icon: '🧠',
  },
  google: {
    id: 'google',
    name: 'Google AI',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.5-pro',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://ai.google.dev/docs',
    icon: '🔵',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    models: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'mistral-tiny',
      'open-mistral-7b',
      'open-mixtral-8x7b',
      'open-mixtral-8x22b',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://docs.mistral.ai/',
    icon: '🟣',
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    endpoint: 'https://api.cohere.ai/v1/chat',
    baseUrl: 'https://api.cohere.ai/v1',
    models: [
      'command-r-plus',
      'command-r',
      'command',
      'command-light',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://docs.cohere.com/',
    icon: '🟠',
  },
  together: {
    id: 'together',
    name: 'Together AI',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    models: [
      'meta-llama/Llama-2-70b-chat-hf',
      'mistralai/Mistral-7B-Instruct-v0.2',
      'meta-llama/Llama-3.1-405B-Instruct-Turbo',
      'meta-llama/Llama-3.1-70B-Instruct-Turbo',
      'Qwen/Qwen2-72B-Instruct',
    ],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: true,
    documentationUrl: 'https://docs.together.ai/',
    icon: '🔷',
  },
  custom: {
    id: 'custom',
    name: 'Custom/Local',
    endpoint: '',
    models: [],
    supportsTools: true,
    supportsStreaming: true,
    apiKeyRequired: false,
    documentationUrl: undefined,
    icon: '⚙️',
  },
};

export const DEFAULT_PROVIDER = 'nvidia';

export function getProvider(providerId: string): AIProvider | undefined {
  return AI_PROVIDERS[providerId];
}

export function getProviderModels(providerId: string): string[] {
  const provider = getProvider(providerId);
  return provider?.models || [];
}

export function getAllProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS);
}
