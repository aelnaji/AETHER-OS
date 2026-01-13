import { NextResponse } from 'next/server';

import { getHealthReport } from '@/lib/health/health';

export const runtime = 'nodejs';

export async function GET() {
  const report = await getHealthReport('readiness');
  const httpStatus = report.status === 'unhealthy' ? 503 : 200;
  return NextResponse.json(report, { status: httpStatus });
}
