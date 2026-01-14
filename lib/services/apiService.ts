/**
 * Real API Service for AETHER-OS
 * Handles actual API connections for chat functionality
 */

export interface APISettings {
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: {
    content: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  error?: string;
}

/**
 * Test connection to the API with provided credentials
 */
export async function testConnection(
  baseUrl: string, 
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate inputs
    if (!baseUrl || !baseUrl.startsWith('http')) {
      return { success: false, message: 'Invalid base URL' };
    }
    
    if (!apiKey || apiKey.length < 10) {
      return { success: false, message: 'Invalid API key' };
    }

    // Try to call a models endpoint or a simple test endpoint
    const testEndpoint = `${baseUrl.replace(/\/$/, '')}/models`;
    
    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true, message: 'Connection successful!' };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Connection failed: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    console.error('Connection test error:', error);
    return { 
      success: false, 
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Send a message to the API and get a response
 */
export async function sendMessage(
  messages: ChatMessage[],
  settings: APISettings
): Promise<ChatResponse> {
  try {
    // Validate settings
    if (!settings.baseUrl || !settings.apiKey) {
      return {
        success: false,
        message: 'API configuration incomplete',
        error: 'Missing base URL or API key'
      };
    }

    const endpoint = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
    
    const requestBody = {
      model: 'gpt-3.5-turbo', // Default model, can be made configurable
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: false,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `API request failed: ${response.status} ${response.statusText}`,
        error: errorText
      };
    }

    const data = await response.json();
    
    // Handle different API response formats
    let content = '';
    let usage = undefined;

    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content;
      usage = data.usage;
    } else if (data.response) {
      content = data.response;
    } else if (data.content) {
      content = data.content;
    } else {
      return {
        success: false,
        message: 'Invalid response format from API',
        error: JSON.stringify(data)
      };
    }

    return {
      success: true,
      message: 'Response received successfully',
      data: {
        content: content.trim(),
        usage
      }
    };

  } catch (error) {
    console.error('Send message error:', error);
    return {
      success: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Stream messages from the API (for providers that support streaming)
 */
export async function* streamMessage(
  messages: ChatMessage[],
  settings: APISettings
): AsyncGenerator<string, ChatResponse, unknown> {
  try {
    // Validate settings
    if (!settings.baseUrl || !settings.apiKey) {
      return {
        success: false,
        message: 'API configuration incomplete',
        error: 'Missing base URL or API key'
      };
    }

    const endpoint = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
    
    const requestBody = {
      model: 'gpt-3.5-turbo', // Default model, can be made configurable
      messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: true,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `API request failed: ${response.status} ${response.statusText}`,
        error: errorText
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        success: false,
        message: 'Failed to get response reader',
        error: 'No response body'
      };
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') {
              return {
                success: true,
                message: 'Stream completed',
                data: { content: '' } // Content already yielded
              };
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const content = parsed.choices[0].delta.content;
                if (content) {
                  yield content;
                }
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
              continue;
            }
          }
        }
      }

      return {
        success: true,
        message: 'Stream completed',
        data: { content: '' }
      };
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('Stream message error:', error);
    return {
      success: false,
      message: `Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}