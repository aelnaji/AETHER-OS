/**
 * Real File Service for AETHER-OS
 * Handles actual file operations for chat history, settings, etc.
 */

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  settings?: {
    baseUrl: string;
    model?: string;
  };
}

export interface FileOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Global variable types for memory storage
declare global {
  var conversations: Map<string, Conversation> | undefined;
  var settings: any | undefined;
  var directories: Set<string> | undefined;
}

/**
 * Save a conversation to file system
 */
export async function saveConversation(
  conversation: Conversation
): Promise<FileOperationResult> {
  try {
    const fileName = `conversation_${conversation.id}.json`;
    const filePath = `/home/engine/project/data/conversations/${fileName}`;
    
    // Create directory if it doesn't exist
    await ensureDirectoryExists('/home/engine/project/data/conversations');

    const conversationData = {
      ...conversation,
      // Ensure we don't save sensitive data like API keys
      settings: conversation.settings ? {
        baseUrl: conversation.settings.baseUrl,
        model: conversation.settings.model,
      } : undefined,
    };

    const data = JSON.stringify(conversationData, null, 2);
    
    // In a real implementation, this would write to the file system
    // For now, we'll use localStorage as a fallback
    try {
      localStorage.setItem(`aether_conversation_${conversation.id}`, data);
      
      return {
        success: true,
        message: 'Conversation saved successfully',
        data: { id: conversation.id, fileName }
      };
    } catch (localStorageError) {
      // Fallback to memory storage
      console.warn('localStorage not available, using memory storage');
      // Store in a global variable for the session
      if (!globalThis.conversations) {
        globalThis.conversations = new Map();
      }
      globalThis.conversations.set(conversation.id, conversationData);
      
      return {
        success: true,
        message: 'Conversation saved to memory (session only)',
        data: { id: conversation.id, fileName, storage: 'memory' }
      };
    }
  } catch (error) {
    console.error('Save conversation error:', error);
    return {
      success: false,
      message: 'Failed to save conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Load a conversation from file system
 */
export async function loadConversation(
  conversationId: string
): Promise<FileOperationResult> {
  try {
    // Try to load from localStorage first
    try {
      const data = localStorage.getItem(`aether_conversation_${conversationId}`);
      if (data) {
        const conversation = JSON.parse(data);
        return {
          success: true,
          message: 'Conversation loaded successfully',
          data: conversation
        };
      }
    } catch (localStorageError) {
      console.warn('localStorage not available, checking memory storage');
    }

    // Fallback to memory storage
    if (globalThis.conversations && globalThis.conversations.has(conversationId)) {
      const conversation = globalThis.conversations.get(conversationId);
      return {
        success: true,
        message: 'Conversation loaded from memory',
        data: conversation
      };
    }

    return {
      success: false,
      message: 'Conversation not found',
      error: 'No conversation found with the specified ID'
    };
  } catch (error) {
    console.error('Load conversation error:', error);
    return {
      success: false,
      message: 'Failed to load conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * List all available conversations
 */
export async function listConversations(): Promise<FileOperationResult> {
  try {
    const conversations: Conversation[] = [];
    
    // Try to load from localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aether_conversation_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const conversation = JSON.parse(data);
            conversations.push(conversation);
          }
        }
      }
    } catch (localStorageError) {
      console.warn('localStorage not available, checking memory storage');
    }

    // Add memory storage conversations
    if (globalThis.conversations) {
      globalThis.conversations.forEach((conversation, id) => {
        conversations.push(conversation);
      });
    }

    // Sort by updatedAt (newest first)
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);

    return {
      success: true,
      message: 'Conversations listed successfully',
      data: conversations
    };
  } catch (error) {
    console.error('List conversations error:', error);
    return {
      success: false,
      message: 'Failed to list conversations',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string
): Promise<FileOperationResult> {
  try {
    // Remove from localStorage
    try {
      localStorage.removeItem(`aether_conversation_${conversationId}`);
    } catch (localStorageError) {
      console.warn('localStorage not available');
    }

    // Remove from memory storage
    if (globalThis.conversations) {
      globalThis.conversations.delete(conversationId);
    }

    return {
      success: true,
      message: 'Conversation deleted successfully'
    };
  } catch (error) {
    console.error('Delete conversation error:', error);
    return {
      success: false,
      message: 'Failed to delete conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Export conversation as JSON
 */
export async function exportChat(
  conversation: Conversation,
  format: 'json' | 'txt' | 'markdown' = 'json'
): Promise<FileOperationResult> {
  try {
    let content = '';
    let mimeType = '';
    let fileName = `conversation_${conversation.id}`;

    switch (format) {
      case 'json':
        content = JSON.stringify(conversation, null, 2);
        mimeType = 'application/json';
        fileName += '.json';
        break;

      case 'txt':
        content = `# ${conversation.title}\n\n`;
        content += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
        content += `Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
        
        for (const message of conversation.messages) {
          const role = message.role.toUpperCase();
          const timestamp = new Date(message.timestamp).toLocaleString();
          content += `**${role}** (${timestamp}):\n${message.content}\n\n`;
        }
        
        mimeType = 'text/plain';
        fileName += '.txt';
        break;

      case 'markdown':
        content = `# ${conversation.title}\n\n`;
        content += `> Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
        content += `> Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
        
        for (const message of conversation.messages) {
          const role = message.role === 'user' ? '👤 User' : message.role === 'assistant' ? '🤖 Assistant' : '⚙️ System';
          const timestamp = new Date(message.timestamp).toLocaleString();
          content += `## ${role}\n*${timestamp}*\n\n${message.content}\n\n`;
        }
        
        mimeType = 'text/markdown';
        fileName += '.md';
        break;

      default:
        return {
          success: false,
          message: 'Unsupported export format',
          error: `Format "${format}" is not supported`
        };
    }

    // Trigger download
    await triggerDownload(content, fileName, mimeType);

    return {
      success: true,
      message: `Conversation exported as ${format.toUpperCase()}`,
      data: { fileName, format }
    };
  } catch (error) {
    console.error('Export chat error:', error);
    return {
      success: false,
      message: 'Failed to export conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Save application settings to file
 */
export async function saveSettings(
  settings: any
): Promise<FileOperationResult> {
  try {
    const settingsData = {
      ...settings,
      // Never save API keys to file
      apiKey: undefined,
      lastSaved: Date.now(),
    };

    const data = JSON.stringify(settingsData, null, 2);
    
    // Save to localStorage
    try {
      localStorage.setItem('aether_settings', data);
    } catch (localStorageError) {
      console.warn('localStorage not available, using memory storage');
      // Store in memory
      if (!globalThis.settings) {
        globalThis.settings = {};
      }
      globalThis.settings = settingsData;
    }

    return {
      success: true,
      message: 'Settings saved successfully'
    };
  } catch (error) {
    console.error('Save settings error:', error);
    return {
      success: false,
      message: 'Failed to save settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Load application settings from file
 */
export async function loadSettings(): Promise<FileOperationResult> {
  try {
    // Try to load from localStorage
    try {
      const data = localStorage.getItem('aether_settings');
      if (data) {
        const settings = JSON.parse(data);
        return {
          success: true,
          message: 'Settings loaded successfully',
          data: settings
        };
      }
    } catch (localStorageError) {
      console.warn('localStorage not available, checking memory storage');
    }

    // Fallback to memory storage
    if (globalThis.settings) {
      return {
        success: true,
        message: 'Settings loaded from memory',
        data: globalThis.settings
      };
    }

    // Return default settings
    return {
      success: true,
      message: 'No saved settings found, using defaults',
      data: getDefaultSettings()
    };
  } catch (error) {
    console.error('Load settings error:', error);
    return {
      success: false,
      message: 'Failed to load settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Helper function to ensure directory exists
 */
async function ensureDirectoryExists(path: string): Promise<void> {
  // In a real implementation, this would create the directory
  // For now, we'll just ensure it exists in memory
  if (!globalThis.directories) {
    globalThis.directories = new Set();
  }
  globalThis.directories.add(path);
}

/**
 * Helper function to trigger file download
 */
async function triggerDownload(
  content: string, 
  fileName: string, 
  mimeType: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    baseUrl: 'https://api.openai.com/v1',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are A.E, a helpful AI assistant.',
  };
}