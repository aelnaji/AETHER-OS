export const publicEnv = {
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
  bytebotEndpoint: process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT ?? 'http://localhost:3001',
  nvidiaApiEndpoint:
    process.env.NEXT_PUBLIC_NVIDIA_API_ENDPOINT ??
    process.env.NEXT_PUBLIC_LLM_ENDPOINT ??
    'https://integrate.api.nvidia.com/v1',
  defaultModel: process.env.NEXT_PUBLIC_DEFAULT_MODEL ?? 'meta/llama-3.1-405b-instruct',
  chatStreaming: process.env.NEXT_PUBLIC_CHAT_STREAMING !== 'false',
} as const;
