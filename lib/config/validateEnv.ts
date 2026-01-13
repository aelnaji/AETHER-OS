export type AetherEnv = 'development' | 'staging' | 'production';

export type ValidatedEnv = {
  aetherEnv: AetherEnv;
  allowNoBytebot: boolean;
  bytebotEndpoint: string;
  nvidiaApiEndpoint: string;
  defaultModel: string;
  appVersion: string;
  healthcheckTimeoutMs: number;
  minFreeMemoryMb: number;
  databaseUrl?: string;
};

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  if (['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase())) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(value.toLowerCase())) return false;
  return defaultValue;
}

function parseIntSafe(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') return defaultValue;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : defaultValue;
}

function asAetherEnv(value: string | undefined): AetherEnv {
  if (value === 'staging') return 'staging';
  if (value === 'production') return 'production';
  return 'development';
}

let cached: ValidatedEnv | null = null;

export function validateEnv(): ValidatedEnv {
  if (cached) return cached;

  const aetherEnv = asAetherEnv(process.env.AETHER_ENV ?? process.env.NODE_ENV);
  const isProdLike = aetherEnv === 'production' || aetherEnv === 'staging';

  const allowNoBytebot = parseBool(
    process.env.AETHER_ALLOW_NO_BYTEBOT,
    aetherEnv === 'development'
  );

  const bytebotEndpoint =
    process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT ?? 'http://localhost:3001';

  const nvidiaApiEndpoint =
    process.env.NEXT_PUBLIC_NVIDIA_API_ENDPOINT ??
    process.env.NEXT_PUBLIC_LLM_ENDPOINT ??
    'https://integrate.api.nvidia.com/v1';

  const defaultModel =
    process.env.NEXT_PUBLIC_DEFAULT_MODEL ?? 'meta/llama-3.1-405b-instruct';

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.APP_VERSION ?? 'dev';

  const healthcheckTimeoutMs = parseIntSafe(
    process.env.HEALTHCHECK_TIMEOUT_MS,
    5000
  );

  const minFreeMemoryMb = parseIntSafe(process.env.MIN_FREE_MEMORY_MB, 128);

  const databaseUrl = process.env.DATABASE_URL || undefined;

  const errors: string[] = [];

  if (healthcheckTimeoutMs <= 0 || healthcheckTimeoutMs > 60000) {
    errors.push('HEALTHCHECK_TIMEOUT_MS must be between 1 and 60000');
  }

  if (minFreeMemoryMb < 0) {
    errors.push('MIN_FREE_MEMORY_MB must be >= 0');
  }

  if (!nvidiaApiEndpoint.startsWith('http')) {
    errors.push('NEXT_PUBLIC_NVIDIA_API_ENDPOINT (or NEXT_PUBLIC_LLM_ENDPOINT) must be a valid http(s) URL');
  }

  if (isProdLike && !allowNoBytebot) {
    if (!process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT) {
      errors.push(
        'NEXT_PUBLIC_BYTEBOT_ENDPOINT is required in staging/production (or set AETHER_ALLOW_NO_BYTEBOT=true)'
      );
    }
  }

  if (errors.length > 0) {
    const msg = [
      '[AETHER-OS] Invalid environment configuration:',
      ...errors.map((e) => `- ${e}`),
      '',
      'See .env.example for the full list of variables.',
    ].join('\n');

    const error = new Error(msg);
    (error as any).code = 'AETHER_ENV_INVALID';
    throw error;
  }

  cached = {
    aetherEnv,
    allowNoBytebot,
    bytebotEndpoint,
    nvidiaApiEndpoint,
    defaultModel,
    appVersion,
    healthcheckTimeoutMs,
    minFreeMemoryMb,
    databaseUrl,
  };

  return cached;
}
