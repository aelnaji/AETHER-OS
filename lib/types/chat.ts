export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolCallResult {
  id: string;
  name: string;
  arguments: string;
  success?: boolean;
  output?: string;
  error?: string;
}

export interface ChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: Message & { tool_calls?: ToolCall[] };
    finish_reason: 'stop' | 'tool_calls' | null;
  }>;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<Message> & { tool_calls?: ToolCall[] };
    finish_reason: 'stop' | 'tool_calls' | null;
  }>;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  toolChoice?: 'auto' | 'none';
  systemPrompt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: MessageBubble[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolCallResult[];
  isLoading?: boolean;
}

export interface StreamEvent {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'tool_use' | 'tool_result' | 'message_stop';
  content?: string;
  toolCall?: ToolCall;
  toolName?: string;
  toolResult?: string;
}
