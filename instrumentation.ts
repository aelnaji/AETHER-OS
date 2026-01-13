import { validateEnv } from '@/lib/config/validateEnv';

export async function register() {
  const aetherEnv = process.env.AETHER_ENV ?? process.env.NODE_ENV;
  const isProdLike = aetherEnv === 'production' || aetherEnv === 'staging';

  try {
    const env = validateEnv();
    console.info(
      JSON.stringify({
        event: 'aether.startup',
        aetherEnv: env.aetherEnv,
        version: env.appVersion,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error(error);
    if (isProdLike) {
      throw error;
    }
  }
}
