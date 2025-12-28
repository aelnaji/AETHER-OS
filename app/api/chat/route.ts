import { NextRequest, NextResponse } from 'next/server';
import { nvidiaClient } from '@/lib/api/nvidiaClient';
import { ALL_TOOL_SCHEMAS, AE_SYSTEM_PROMPT } from '@/lib/api/toolSchemas';
import { Message, ChatOptions } from '@/lib/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, includeTools = true } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
      includeTools?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const options: ChatOptions = {
            model: model || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'meta/llama-3.1-405b-instruct',
            temperature: 0.7,
            maxTokens: 2048,
            systemPrompt: AE_SYSTEM_PROMPT,
            tools: includeTools ? ALL_TOOL_SCHEMAS : undefined,
            toolChoice: includeTools ? 'auto' : undefined,
          };

          const messageObjects: Message[] = messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          const isStreaming = process.env.NEXT_PUBLIC_CHAT_STREAMING !== 'false';

          if (isStreaming) {
            for await (const chunk of nvidiaClient.streamChat(messageObjects, options)) {
              const data = JSON.stringify({
                type: 'chunk',
                data: chunk,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } else {
            const completion = await nvidiaClient.chat(messageObjects, options);
            const data = JSON.stringify({
              type: 'completion',
              data: completion,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const isValid = await nvidiaClient.validateApiKey();
    const models = await nvidiaClient.getAvailableModels();

    return NextResponse.json({
      status: isValid ? 'ready' : 'missing_api_key',
      models,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
