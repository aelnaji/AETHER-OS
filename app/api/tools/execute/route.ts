import { NextRequest, NextResponse } from 'next/server';
import { toolExecutor } from '@/lib/services/toolExecutor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolCalls } = body as {
      toolCalls: Array<{ name: string; arguments: string }>;
    };

    if (!toolCalls || !Array.isArray(toolCalls)) {
      return NextResponse.json(
        { error: 'Tool calls array is required' },
        { status: 400 }
      );
    }

    const results = await toolExecutor.executeTools(toolCalls);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute tools' },
      { status: 500 }
    );
  }
}
