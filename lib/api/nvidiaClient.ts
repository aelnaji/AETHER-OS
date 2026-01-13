import { 
  Message, 
  ChatCompletion, 
  ChatCompletionChunk, 
  ChatOptions,
} from '@/lib/types/chat';
import { ToolDefinition } from '@/lib/types/tools';

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    delta?: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason?: string | null;
  }>;
}

export class NvidiaClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.NVIDIA_API_KEY || '';
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_NVIDIA_API_ENDPOINT ||
      process.env.NEXT_PUBLIC_LLM_ENDPOINT ||
      'https://integrate.api.nvidia.com/v1';
    this.defaultModel =
      process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'meta/llama-3.1-405b-instruct';
  }

  private buildUrl(model: string): string {
    return `${this.baseUrl}/chat/completions`;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(this.buildUrl(this.defaultModel), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      'meta/llama-3.1-405b-instruct',
      'meta/llama-3.1-70b-instruct',
      'mistralai/mistral-large',
      'mistralai/mistral-7b-instruct-v0.1',
      'google/gemma-7b',
    ];
  }

  async chat(
    messages: Message[],
    options: ChatOptions = {}
  ): Promise<ChatCompletion> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2048;
    const tools = options.tools;

    const systemMessages = options.systemPrompt 
      ? [{ role: 'system' as const, content: options.systemPrompt }] 
      : [];

    const requestBody: Record<string, any> = {
      model,
      messages: [...systemMessages, ...messages],
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = options.toolChoice || 'auto';
    }

    const response = await fetch(this.buildUrl(model), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
    }

    const data: ChatResponse = await response.json();

    return this.transformCompletion(data);
  }

  async *streamChat(
    messages: Message[],
    options: ChatOptions = {}
  ): AsyncGenerator<ChatCompletionChunk> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2048;
    const tools = options.tools;

    const systemMessages = options.systemPrompt 
      ? [{ role: 'system' as const, content: options.systemPrompt }] 
      : [];

    const requestBody: Record<string, any> = {
      model,
      messages: [...systemMessages, ...messages],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = options.toolChoice || 'auto';
    }

    const response = await fetch(this.buildUrl(model), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            return;
          }

          try {
            const data: ChatResponse = JSON.parse(dataStr);
            const chunk = this.transformChunk(data);
            if (chunk) {
              yield chunk;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  }

  private transformCompletion(data: ChatResponse): ChatCompletion {
    return {
      id: data.id,
      object: 'chat.completion',
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: (choice.message?.role || 'assistant') as 'user' | 'assistant' | 'system',
          content: choice.message?.content || '',
          tool_calls: choice.message?.tool_calls?.map((tc) => ({
            id: tc.id,
            type: tc.type as 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        },
        finish_reason: (choice.finish_reason as 'stop' | 'tool_calls' | null) || null,
      })),
    };
  }

  private transformChunk(data: ChatResponse): ChatCompletionChunk | null {
    if (data.choices.length === 0) {
      return null;
    }

    return {
      id: data.id,
      object: 'chat.completion.chunk',
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice) => ({
        index: choice.index,
        delta: {
          role: choice.delta?.role as 'assistant' | undefined,
          content: choice.delta?.content,
          tool_calls: choice.delta?.tool_calls?.map((tc) => ({
            id: tc.id,
            type: tc.type as 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        },
        finish_reason: choice.finish_reason as 'stop' | 'tool_calls' | null,
      })),
    };
  }
}

export const nvidiaClient = new NvidiaClient();
