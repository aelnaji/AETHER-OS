/**
 * AI Actions Service - Execute various AI operations via Puter.js
 */

import {
  AIGenerationRequest,
  AIGenerationResponse,
  AIImageGenerationRequest,
  AIImageGenerationResponse,
  AIVoiceRequest,
  AIVoiceResponse,
  AITranscriptionRequest,
  AITranscriptionResponse,
  AIVideoGenerationRequest,
  AIVideoGenerationResponse,
} from '@/lib/types/ai';

// Check if Puter.js is available
const isPuterAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).puter !== 'undefined';
};

/**
 * Chat completion with streaming support
 */
export async function chatCompletion(
  request: AIGenerationRequest,
  onChunk?: (chunk: string) => void
): Promise<AIGenerationResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    const startTime = Date.now();

    if (request.options?.stream && onChunk) {
      // Streaming mode
      let fullContent = '';
      const stream = await puter.ai.chat(request.model, [
        ...(request.options.systemPrompt ? [{ role: 'system', content: request.options.systemPrompt }] : []),
        { role: 'user', content: request.prompt, images: request.options.images },
      ], {
        temperature: request.options.temperature,
        max_tokens: request.options.maxTokens,
        top_p: request.options.topP,
        frequency_penalty: request.options.frequencyPenalty,
        presence_penalty: request.options.presencePenalty,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.content || chunk.delta?.content || '';
        fullContent += content;
        onChunk(content);
      }

      return {
        id: `chat-${Date.now()}`,
        content: fullContent,
        model: request.model,
        provider: 'openai', // Will be determined by model
        timestamp: Date.now(),
        tokens: {
          input: estimateTokens(request.prompt),
          output: estimateTokens(fullContent),
          total: estimateTokens(request.prompt) + estimateTokens(fullContent),
        },
        finishReason: 'stop',
      };
    } else {
      // Non-streaming mode
      const response = await puter.ai.chat(request.model, [
        ...(request.options?.systemPrompt ? [{ role: 'system', content: request.options.systemPrompt }] : []),
        { role: 'user', content: request.prompt, images: request.options?.images },
      ], {
        temperature: request.options?.temperature,
        max_tokens: request.options?.maxTokens,
        top_p: request.options?.topP,
        frequency_penalty: request.options?.frequencyPenalty,
        presence_penalty: request.options?.presencePenalty,
      });

      const content = response.message?.content || response.content || '';

      return {
        id: response.id || `chat-${Date.now()}`,
        content,
        model: request.model,
        provider: 'openai',
        timestamp: Date.now(),
        tokens: {
          input: response.usage?.prompt_tokens || estimateTokens(request.prompt),
          output: response.usage?.completion_tokens || estimateTokens(content),
          total: response.usage?.total_tokens || estimateTokens(request.prompt + content),
        },
        finishReason: response.finish_reason || 'stop',
      };
    }
  } catch (error: any) {
    console.error('Chat completion error:', error);
    return {
      id: `error-${Date.now()}`,
      content: '',
      model: request.model,
      provider: 'openai',
      timestamp: Date.now(),
      error: error.message || 'Failed to generate response',
    };
  }
}

/**
 * Generate images from text
 */
export async function generateImage(
  request: AIImageGenerationRequest
): Promise<AIImageGenerationResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    
    const response = await puter.ai.txt2img(request.model, request.prompt, {
      size: request.options?.size,
      quality: request.options?.quality,
      style: request.options?.style,
      n: request.options?.n || 1,
    });

    return {
      images: Array.isArray(response) ? response : [response],
      model: request.model,
      provider: 'openai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('Image generation error:', error);
    return {
      images: [],
      model: request.model,
      provider: 'openai',
      timestamp: Date.now(),
      error: error.message || 'Failed to generate image',
    };
  }
}

/**
 * Analyze images (OCR, vision)
 */
export async function analyzeImage(
  model: string,
  imageUrl: string,
  prompt: string = 'Describe this image in detail'
): Promise<AIGenerationResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    
    const response = await puter.ai.img2txt(model, imageUrl, prompt);

    return {
      id: `img2txt-${Date.now()}`,
      content: response.text || response.content || '',
      model,
      provider: 'openai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('Image analysis error:', error);
    return {
      id: `error-${Date.now()}`,
      content: '',
      model,
      provider: 'openai',
      timestamp: Date.now(),
      error: error.message || 'Failed to analyze image',
    };
  }
}

/**
 * Text to speech
 */
export async function textToSpeech(
  request: AIVoiceRequest
): Promise<AIVoiceResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    
    const response = await puter.ai.txt2speech(
      request.model || 'tts-1',
      request.text,
      {
        voice: request.voice || 'alloy',
        speed: request.options?.speed || 1.0,
        format: request.options?.format || 'mp3',
      }
    );

    return {
      audio: response.audio || response.url || response,
      model: request.model || 'tts-1',
      provider: 'openai',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('Text to speech error:', error);
    return {
      audio: '',
      model: request.model || 'tts-1',
      provider: 'openai',
      timestamp: Date.now(),
      error: error.message || 'Failed to generate speech',
    };
  }
}

/**
 * Speech to text (transcription)
 */
export async function speechToText(
  request: AITranscriptionRequest
): Promise<AITranscriptionResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    
    const response = await puter.ai.speech2txt(
      request.model || 'whisper-1',
      request.audio,
      {
        language: request.options?.language,
        prompt: request.options?.prompt,
        temperature: request.options?.temperature,
      }
    );

    return {
      text: response.text || response.transcription || '',
      model: request.model || 'whisper-1',
      provider: 'openai',
      timestamp: Date.now(),
      language: response.language,
    };
  } catch (error: any) {
    console.error('Speech to text error:', error);
    return {
      text: '',
      model: request.model || 'whisper-1',
      provider: 'openai',
      timestamp: Date.now(),
      error: error.message || 'Failed to transcribe audio',
    };
  }
}

/**
 * Voice to voice (speech to speech)
 */
export async function speechToSpeech(
  audio: string,
  targetVoice: string,
  model?: string
): Promise<AIVoiceResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    
    const response = await puter.ai.speech2speech(
      model || 'speech2speech-1',
      audio,
      { voice: targetVoice }
    );

    return {
      audio: response.audio || response.url || response,
      model: model || 'speech2speech-1',
      provider: 'elevenlabs',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error('Speech to speech error:', error);
    return {
      audio: '',
      model: model || 'speech2speech-1',
      provider: 'elevenlabs',
      timestamp: Date.now(),
      error: error.message || 'Failed to convert speech',
    };
  }
}

/**
 * Generate video from text
 */
export async function generateVideo(
  request: AIVideoGenerationRequest
): Promise<AIVideoGenerationResponse> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js SDK not available');
  }

  try {
    const puter = (window as any).puter;
    
    const response = await puter.ai.txt2vid(
      request.model || 'sora',
      request.prompt,
      {
        duration: request.options?.duration || 4,
        size: request.options?.size || '1080x1920',
        fps: request.options?.fps || 30,
      }
    );

    return {
      video: response.video || response.url || response,
      model: request.model || 'sora',
      provider: 'openai',
      timestamp: Date.now(),
      duration: request.options?.duration || 4,
    };
  } catch (error: any) {
    console.error('Video generation error:', error);
    return {
      video: '',
      model: request.model || 'sora',
      provider: 'openai',
      timestamp: Date.now(),
      duration: 0,
      error: error.message || 'Failed to generate video',
    };
  }
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost based on token usage and pricing
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing?: { inputTokens?: number; outputTokens?: number }
): number {
  if (!pricing) return 0;
  
  const inputCost = (inputTokens / 1000) * (pricing.inputTokens || 0);
  const outputCost = (outputTokens / 1000) * (pricing.outputTokens || 0);
  
  return inputCost + outputCost;
}
