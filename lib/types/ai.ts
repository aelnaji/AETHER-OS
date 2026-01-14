/**
 * AI Types for QuickyAI Multi-Model Support
 */

export type AIProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'mistral'
  | 'together'
  | 'elevenlabs'
  | 'aws'
  | 'custom';

export type AICapability = 
  | 'chat'
  | 'vision'
  | 'image-generation'
  | 'function-calling'
  | 'long-context'
  | 'tts'
  | 'stt'
  | 'speech2speech'
  | 'video-generation'
  | 'ocr';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
  capabilities: AICapability[];
  contextLength?: number;
  pricing?: {
    inputTokens?: number;  // Cost per 1K input tokens
    outputTokens?: number; // Cost per 1K output tokens
    perRequest?: number;   // Fixed cost per request
  };
  maxTokens?: number;
  supportStreaming?: boolean;
  vision?: boolean;
  metadata?: Record<string, any>;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  images?: string[]; // Base64 or URLs
  error?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  provider: AIProvider;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    totalTokens?: number;
    estimatedCost?: number;
    tags?: string[];
  };
}

export interface AIGenerationRequest {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    systemPrompt?: string;
    images?: string[]; // For vision models
    stream?: boolean;
  };
}

export interface AIGenerationResponse {
  id: string;
  content: string;
  model: string;
  provider: AIProvider;
  timestamp: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  error?: string;
}

export interface AIImageGenerationRequest {
  model: string;
  prompt: string;
  options?: {
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    n?: number; // Number of images
  };
}

export interface AIImageGenerationResponse {
  images: string[]; // URLs or base64
  model: string;
  provider: AIProvider;
  timestamp: number;
  cost?: number;
  error?: string;
}

export interface AIVoiceRequest {
  text: string;
  model?: string;
  voice?: string;
  options?: {
    speed?: number;
    pitch?: number;
    format?: 'mp3' | 'wav' | 'ogg';
  };
}

export interface AIVoiceResponse {
  audio: string; // Base64 or URL
  model: string;
  provider: AIProvider;
  timestamp: number;
  duration?: number;
  cost?: number;
  error?: string;
}

export interface AITranscriptionRequest {
  audio: string; // Base64 or File
  model?: string;
  options?: {
    language?: string;
    prompt?: string;
    temperature?: number;
  };
}

export interface AITranscriptionResponse {
  text: string;
  model: string;
  provider: AIProvider;
  timestamp: number;
  language?: string;
  duration?: number;
  cost?: number;
  error?: string;
}

export interface AIVideoGenerationRequest {
  prompt: string;
  model?: string;
  options?: {
    duration?: 4 | 8 | 12; // seconds
    size?: '1080x1920' | '1920x1080' | '1024x1024';
    fps?: number;
  };
}

export interface AIVideoGenerationResponse {
  video: string; // URL or base64
  model: string;
  provider: AIProvider;
  timestamp: number;
  duration: number;
  cost?: number;
  error?: string;
}

export interface AIActivity {
  id: string;
  type: 'chat' | 'image' | 'voice' | 'video' | 'transcription' | 'ocr';
  model: string;
  provider: AIProvider;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: number;
  progress?: number; // 0-100
  result?: any;
  error?: string;
  metadata?: {
    prompt?: string;
    tokens?: number;
    cost?: number;
  };
}

export interface AIModelGroup {
  provider: AIProvider;
  models: AIModel[];
  count: number;
}

export interface AISettings {
  defaultChatModel?: string;
  defaultImageModel?: string;
  defaultVoiceModel?: string;
  defaultVideoModel?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  streamingEnabled?: boolean;
  autoSaveConversations?: boolean;
  preferredProviders?: AIProvider[];
}

export interface AIBookmark {
  id: string;
  conversationId: string;
  messageId: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: number;
}

export interface AIModelFilter {
  providers?: AIProvider[];
  capabilities?: AICapability[];
  searchQuery?: string;
  minContextLength?: number;
  maxCost?: number;
}
