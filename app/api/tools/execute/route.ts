import { NextRequest, NextResponse } from 'next/server';
import { BytebotToolExecutor } from '@/lib/services/bytebot-executor';
import { getSettingsFromCookies } from '@/lib/utils/getSettings';

let executor: BytebotToolExecutor | null = null;

function getExecutor(): BytebotToolExecutor {
  if (!executor) {
    const endpoint = process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT || 'http://localhost:3001';
    executor = new BytebotToolExecutor(endpoint);
  }
  return executor;
}

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

    const executor = getExecutor();
    
    // Check if Bytebot backend is available
    if (!executor.isConnected()) {
      // Return simulated results for development mode
      const simulatedResults = toolCalls.map((toolCall) => ({
        toolName: toolCall.name,
        success: true,
        output: `[SIMULATED] ${toolCall.name} executed with args: ${toolCall.arguments}`,
      }));
      
      return NextResponse.json(simulatedResults);
    }

    const results = await Promise.all(
      toolCalls.map(async (toolCall) => {
        try {
          const args = JSON.parse(toolCall.arguments || '{}');
          const result = await executor.executeTool(toolCall.name, args);
          
          return {
            toolName: toolCall.name,
            success: result.success,
            output: result.output || '',
            error: result.error,
          };
        } catch (error) {
          return {
            toolName: toolCall.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute tools' },
      { status: 500 }
    );
  }
}
