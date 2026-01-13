import { NextResponse } from 'next/server';

import { getConfig } from '@/lib/config/config';

export const runtime = 'nodejs';

export async function GET() {
  let version = 'unknown';
  let environment = process.env.AETHER_ENV ?? process.env.NODE_ENV ?? 'development';

  try {
    const cfg = getConfig();
    version = cfg.appVersion;
    environment = cfg.aetherEnv;
  } catch {
    // Liveness should stay lightweight and never fail due to config.
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    environment,
  });
}
