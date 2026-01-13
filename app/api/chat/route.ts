import { NextRequest, NextResponse } from 'next/server';
import { NvidiaClient } from '@/lib/api/nvidiaClient';
import { ALL_TOOL_SCHEMAS } from '@/lib/api/toolSchemas';
import { Message, ChatOptions } from '@/lib/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model: bodyModel, includeTools = true } = body as {
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

    // Get NVIDIA API settings from request headers or body
    const apiKey = request.headers.get('x-nvidia-api-key') || body.apiKey || '';
    const model = request.headers.get('x-nvidia-model') || bodyModel || 'meta/llama-3.1-405b-instruct';
    const temperature = parseFloat(request.headers.get('x-nvidia-temperature') || body.temperature?.toString() || '0.7');
    const maxTokens = parseInt(request.headers.get('x-nvidia-max-tokens') || body.maxTokens?.toString() || '2048');
    const systemPrompt = request.headers.get('x-nvidia-system-prompt') || body.systemPrompt || `You are A.E (AETHER ENGINE), an autonomous AI agent integrated into AETHER-OS running on a local Docker environment. You can control the desktop, execute code, manage files, and accomplish real tasks. You have access to:
- Terminal/shell commands
- File system operations (read, write, create, delete)
- Application launching and management
- Code execution (Python, Node.js, Bash)
- Git operations

Be conversational, helpful, and always explain what you're doing before executing tools.`;

    // Validate API key
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'NVIDIA API key not configured. Please configure your API key in Settings.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const options: ChatOptions = {
            model: model,
            temperature: temperature,
            maxTokens: maxTokens,
            systemPrompt: systemPrompt,
            tools: includeTools ? ALL_TOOL_SCHEMAS : undefined,
            toolChoice: includeTools ? 'auto' : undefined,
          };

          const messageObjects: Message[] = messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          // Create a new client instance with the user's API key
          const client = new NvidiaClient(apiKey);
          
          const isStreaming = process.env.NEXT_PUBLIC_CHAT_STREAMING !== 'false';

          if (isStreaming) {
            for await (const chunk of client.streamChat(messageObjects, options)) {
              const data = JSON.stringify({
                type: 'chunk',
                data: chunk,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } else {
            const completion = await client.chat(messageObjects, options);
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

export async function GET(request: NextRequest) {
  try {
    // Get API key from headers for validation
    const apiKey = request.headers.get('x-nvidia-api-key');
    
    if (apiKey) {
      // Validate the API key
      try {
        const client = new NvidiaClient(apiKey);
        const isValid = await client.validateApiKey();
        
        return NextResponse.json({
          status: isValid ? 'ready' : 'invalid_api_key',
          models: [
            'meta/llama-3.1-405b-instruct',
            'mistralai/mistral-large',
            'meta/llama-3.1-70b-instruct',
            'qwen/qwen-1.5-32b-chat',
            'mistralai/mistral-7b-instruct'
          ],
        });
      } catch (error) {
        return NextResponse.json({
          status: 'error',
          error: 'Failed to validate API key',
          models: [
            'meta/llama-3.1-405b-instruct',
            'mistralai/mistral-large',
            'meta/llama-3.1-70b-instruct',
            'qwen/qwen-1.5-32b-chat',
            'mistralai/mistral-7b-instruct'
          ],
        });
      }
    }

    // Return available models for the dropdown (no API key validation)
    return NextResponse.json({
      status: 'ready',
      models: [
        'meta/llama-3.1-405b-instruct',
        'mistralai/mistral-large',
        'meta/llama-3.1-70b-instruct',
        'qwen/qwen-1.5-32b-chat',
        'mistralai/mistral-7b-instruct'
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
