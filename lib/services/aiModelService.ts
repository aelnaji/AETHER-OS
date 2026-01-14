/**
 * AI Model Service - Manages 500+ AI models via Puter.js SDK
 */

import { AIModel, AIProvider, AICapability, AIModelGroup, AIModelFilter } from '@/lib/types/ai';

// Check if Puter.js is available
const isPuterAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).puter !== 'undefined';
};

// Cache for model list
let modelCache: AIModel[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch all available AI models from Puter.js
 */
export async function fetchModels(): Promise<AIModel[]> {
  // Check cache first
  if (modelCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return modelCache;
  }

  if (!isPuterAvailable()) {
    console.warn('Puter.js SDK not available, using fallback models');
    return getFallbackModels();
  }

  try {
    const puter = (window as any).puter;
    const models = await puter.ai.listModels();
    
    // Transform Puter models to our format
    const transformedModels: AIModel[] = models.map((model: any) => ({
      id: model.id || model.name,
      name: model.name,
      provider: mapProviderName(model.provider),
      description: model.description,
      capabilities: mapCapabilities(model),
      contextLength: model.context_length || model.max_tokens,
      pricing: model.pricing ? {
        inputTokens: model.pricing.input,
        outputTokens: model.pricing.output,
        perRequest: model.pricing.request,
      } : undefined,
      maxTokens: model.max_tokens,
      supportStreaming: model.stream_support !== false,
      vision: model.vision || model.multimodal,
      metadata: model.metadata || {},
    }));

    modelCache = transformedModels;
    lastFetchTime = Date.now();
    
    return transformedModels;
  } catch (error) {
    console.error('Failed to fetch models from Puter.js:', error);
    return getFallbackModels();
  }
}

/**
 * Get models grouped by provider
 */
export async function getModelsByProvider(): Promise<AIModelGroup[]> {
  const models = await fetchModels();
  
  const grouped = models.reduce((acc, model) => {
    const existing = acc.find(g => g.provider === model.provider);
    if (existing) {
      existing.models.push(model);
      existing.count++;
    } else {
      acc.push({
        provider: model.provider,
        models: [model],
        count: 1,
      });
    }
    return acc;
  }, [] as AIModelGroup[]);

  return grouped.sort((a, b) => b.count - a.count);
}

/**
 * Filter models based on criteria
 */
export async function filterModels(filter: AIModelFilter): Promise<AIModel[]> {
  const models = await fetchModels();
  
  return models.filter(model => {
    // Filter by provider
    if (filter.providers && filter.providers.length > 0) {
      if (!filter.providers.includes(model.provider)) return false;
    }

    // Filter by capabilities
    if (filter.capabilities && filter.capabilities.length > 0) {
      const hasAllCapabilities = filter.capabilities.every(cap =>
        model.capabilities.includes(cap)
      );
      if (!hasAllCapabilities) return false;
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesSearch = 
        model.name.toLowerCase().includes(query) ||
        (model.description && model.description.toLowerCase().includes(query)) ||
        model.id.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter by context length
    if (filter.minContextLength && model.contextLength) {
      if (model.contextLength < filter.minContextLength) return false;
    }

    // Filter by cost
    if (filter.maxCost && model.pricing) {
      const avgCost = ((model.pricing.inputTokens || 0) + (model.pricing.outputTokens || 0)) / 2;
      if (avgCost > filter.maxCost) return false;
    }

    return true;
  });
}

/**
 * Get a specific model by ID
 */
export async function getModelById(modelId: string): Promise<AIModel | undefined> {
  const models = await fetchModels();
  return models.find(m => m.id === modelId);
}

/**
 * Get models by capability
 */
export async function getModelsByCapability(capability: AICapability): Promise<AIModel[]> {
  const models = await fetchModels();
  return models.filter(m => m.capabilities.includes(capability));
}

/**
 * Get recommended models for different tasks
 */
export async function getRecommendedModels() {
  const models = await fetchModels();
  
  return {
    chat: models.find(m => m.capabilities.includes('chat') && m.provider === 'openai') || 
          models.find(m => m.capabilities.includes('chat')),
    vision: models.find(m => m.capabilities.includes('vision')) || 
            models.find(m => m.vision),
    imageGeneration: models.find(m => m.capabilities.includes('image-generation')),
    tts: models.find(m => m.capabilities.includes('tts')),
    stt: models.find(m => m.capabilities.includes('stt')),
    video: models.find(m => m.capabilities.includes('video-generation')),
  };
}

/**
 * Clear model cache (for manual refresh)
 */
export function clearModelCache(): void {
  modelCache = null;
  lastFetchTime = 0;
}

// Helper functions

function mapProviderName(provider: string): AIProvider {
  const lowerProvider = (provider || '').toLowerCase();
  
  if (lowerProvider.includes('openai') || lowerProvider.includes('gpt')) return 'openai';
  if (lowerProvider.includes('anthropic') || lowerProvider.includes('claude')) return 'anthropic';
  if (lowerProvider.includes('google') || lowerProvider.includes('gemini')) return 'google';
  if (lowerProvider.includes('xai') || lowerProvider.includes('grok')) return 'xai';
  if (lowerProvider.includes('mistral')) return 'mistral';
  if (lowerProvider.includes('together')) return 'together';
  if (lowerProvider.includes('eleven')) return 'elevenlabs';
  if (lowerProvider.includes('aws') || lowerProvider.includes('polly')) return 'aws';
  
  return 'custom';
}

function mapCapabilities(model: any): AICapability[] {
  const capabilities: AICapability[] = [];
  
  // Default to chat for text models
  if (model.type === 'text' || model.type === 'chat' || !model.type) {
    capabilities.push('chat');
  }
  
  if (model.vision || model.multimodal) capabilities.push('vision');
  if (model.function_calling) capabilities.push('function-calling');
  if (model.context_length && model.context_length > 32000) capabilities.push('long-context');
  if (model.type === 'image' || model.image_generation) capabilities.push('image-generation');
  if (model.type === 'tts' || model.text_to_speech) capabilities.push('tts');
  if (model.type === 'stt' || model.speech_to_text) capabilities.push('stt');
  if (model.type === 'video') capabilities.push('video-generation');
  if (model.ocr) capabilities.push('ocr');
  if (model.speech2speech) capabilities.push('speech2speech');
  
  return capabilities.length > 0 ? capabilities : ['chat'];
}

/**
 * Fallback models when Puter.js is not available
 */
function getFallbackModels(): AIModel[] {
  return [
    // OpenAI Models
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      description: 'Most capable GPT-4 model with 128K context',
      capabilities: ['chat', 'vision', 'function-calling', 'long-context'],
      contextLength: 128000,
      maxTokens: 4096,
      supportStreaming: true,
      vision: true,
      pricing: { inputTokens: 0.01, outputTokens: 0.03 },
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      description: 'Advanced reasoning and complex task handling',
      capabilities: ['chat', 'function-calling'],
      contextLength: 8192,
      maxTokens: 4096,
      supportStreaming: true,
      pricing: { inputTokens: 0.03, outputTokens: 0.06 },
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      description: 'Fast and efficient for most tasks',
      capabilities: ['chat', 'function-calling'],
      contextLength: 16384,
      maxTokens: 4096,
      supportStreaming: true,
      pricing: { inputTokens: 0.0005, outputTokens: 0.0015 },
    },
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'openai',
      description: 'Advanced image generation',
      capabilities: ['image-generation'],
      supportStreaming: false,
      pricing: { perRequest: 0.04 },
    },
    // Anthropic Models
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      description: 'Most capable Claude model',
      capabilities: ['chat', 'vision', 'long-context'],
      contextLength: 200000,
      maxTokens: 4096,
      supportStreaming: true,
      vision: true,
      pricing: { inputTokens: 0.015, outputTokens: 0.075 },
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      description: 'Balanced performance and speed',
      capabilities: ['chat', 'vision', 'long-context'],
      contextLength: 200000,
      maxTokens: 4096,
      supportStreaming: true,
      vision: true,
      pricing: { inputTokens: 0.003, outputTokens: 0.015 },
    },
    // Google Models
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      description: 'Google\'s most capable model',
      capabilities: ['chat', 'vision', 'long-context'],
      contextLength: 1000000,
      maxTokens: 8192,
      supportStreaming: true,
      vision: true,
      pricing: { inputTokens: 0.00025, outputTokens: 0.0005 },
    },
    // xAI Models
    {
      id: 'grok-2',
      name: 'Grok 2',
      provider: 'xai',
      description: 'Latest xAI model with real-time knowledge',
      capabilities: ['chat', 'function-calling'],
      contextLength: 32000,
      maxTokens: 4096,
      supportStreaming: true,
      pricing: { inputTokens: 0.002, outputTokens: 0.01 },
    },
    // Mistral Models
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'mistral',
      description: 'Flagship model with strong performance',
      capabilities: ['chat', 'function-calling'],
      contextLength: 32000,
      maxTokens: 4096,
      supportStreaming: true,
      pricing: { inputTokens: 0.004, outputTokens: 0.012 },
    },
  ];
}
