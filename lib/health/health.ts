import os from 'node:os';
import net from 'node:net';

import { getConfig } from '@/lib/config/config';

export type CheckStatus = 'ok' | 'fail' | 'skipped';

export type CheckResult = {
  status: CheckStatus;
  details?: Record<string, unknown>;
  error?: string;
  latencyMs?: number;
};

export type HealthReport = {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    resources: CheckResult;
    bytebot: CheckResult;
    database: CheckResult;
  };
  durationMs: number;
};

function nowIso() {
  return new Date().toISOString();
}

function isProdLike(env: string) {
  return env === 'production' || env === 'staging';
}

async function checkSocketIoEndpoint(endpoint: string, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now();
  try {
    const url = new URL(endpoint);
    url.pathname = '/socket.io/';
    url.searchParams.set('EIO', '4');
    url.searchParams.set('transport', 'polling');
    url.searchParams.set('t', Date.now().toString());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url.toString(), {
        cache: 'no-store',
        signal: controller.signal,
      });

      return {
        status: res.ok ? 'ok' : 'fail',
        latencyMs: Date.now() - start,
        details: { url: url.toString(), httpStatus: res.status },
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      status: 'fail',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { endpoint },
    };
  }
}

async function checkTcp(host: string, port: number, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();

    const onDone = (result: CheckResult) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ ...result, latencyMs: Date.now() - start });
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      onDone({ status: 'ok', details: { host, port } });
    });

    socket.once('timeout', () => {
      onDone({ status: 'fail', error: 'Connection timed out', details: { host, port } });
    });

    socket.once('error', (err) => {
      onDone({ status: 'fail', error: err.message, details: { host, port } });
    });

    socket.connect(port, host);
  });
}

function checkResources(minFreeMemoryMb: number): CheckResult {
  const freeMb = Math.round(os.freemem() / 1024 / 1024);
  const totalMb = Math.round(os.totalmem() / 1024 / 1024);
  const loadAvg = os.loadavg?.() ?? [];

  const ok = freeMb >= minFreeMemoryMb;

  return {
    status: ok ? 'ok' : 'fail',
    details: {
      freeMemoryMb: freeMb,
      totalMemoryMb: totalMb,
      minFreeMemoryMb,
      loadAvg1m: loadAvg[0],
      loadAvg5m: loadAvg[1],
      loadAvg15m: loadAvg[2],
    },
    error: ok ? undefined : `Low free memory: ${freeMb}MB < ${minFreeMemoryMb}MB`,
  };
}

export async function getHealthReport(kind: 'health' | 'readiness' | 'liveness'): Promise<HealthReport> {
  const start = Date.now();
  const cfg = getConfig();

  const resources = checkResources(cfg.minFreeMemoryMb);

  const prodLike = isProdLike(cfg.aetherEnv);
  const bytebotIsCritical = prodLike && !cfg.allowNoBytebot;

  const bytebot =
    kind === 'liveness'
      ? ({ status: 'skipped' } satisfies CheckResult)
      : await checkSocketIoEndpoint(cfg.bytebotEndpoint, cfg.healthcheckTimeoutMs);

  const database =
    kind === 'readiness' && cfg.databaseUrl
      ? await (async () => {
          try {
            const dbUrl = new URL(cfg.databaseUrl!);
            const port = dbUrl.port ? Number.parseInt(dbUrl.port, 10) : 5432;
            const host = dbUrl.hostname;
            return await checkTcp(host, port, cfg.healthcheckTimeoutMs);
          } catch (error) {
            return {
              status: 'fail',
              error: error instanceof Error ? error.message : 'Invalid DATABASE_URL',
            } satisfies CheckResult;
          }
        })()
      : ({ status: 'skipped' } satisfies CheckResult);

  const criticalFailures: Array<string> = [];
  const nonCriticalFailures: Array<string> = [];

  if (resources.status === 'fail') criticalFailures.push('resources');
  if (bytebotIsCritical && bytebot.status === 'fail') criticalFailures.push('bytebot');

  if (!bytebotIsCritical && bytebot.status === 'fail') nonCriticalFailures.push('bytebot');
  if (database.status === 'fail') nonCriticalFailures.push('database');

  const status: HealthReport['status'] =
    criticalFailures.length > 0
      ? 'unhealthy'
      : nonCriticalFailures.length > 0
        ? 'degraded'
        : 'ok';

  const report: HealthReport = {
    status,
    timestamp: nowIso(),
    version: cfg.appVersion,
    environment: cfg.aetherEnv,
    checks: {
      resources,
      bytebot,
      database,
    },
    durationMs: Date.now() - start,
  };

  console.info(
    JSON.stringify({
      event: `aether.health.${kind}`,
      status: report.status,
      durationMs: report.durationMs,
      timestamp: report.timestamp,
      checks: {
        resources: report.checks.resources.status,
        bytebot: report.checks.bytebot.status,
        database: report.checks.database.status,
      },
    })
  );

  return report;
}
