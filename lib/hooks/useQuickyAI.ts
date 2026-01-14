/**
 * QuickyAI Hook - State management for multi-model AI interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AIModel,
  AIMessage,
  AIConversation,
  AIActivity,
  AISettings,
  AIBookmark,
  AIGenerationRequest,
  AIImageGenerationRequest,
  AIVoiceRequest,
  AITranscriptionRequest,
  AIVideoGenerationRequest,
} from '@/lib/types/ai';
import { fetchModels, getModelsByProvider, getRecommendedModels } from '@/lib/services/aiModelService';
import {
  chatCompletion,
  generateImage,
  analyzeImage,
  textToSpeech,
  speechToText,
  speechToSpeech,
  generateVideo,
  calculateCost,
} from '@/lib/services/aiActionsService';

const STORAGE_KEY_CONVERSATIONS = 'quickyai_conversations';
const STORAGE_KEY_SETTINGS = 'quickyai_settings';
const STORAGE_KEY_BOOKMARKS = 'quickyai_bookmarks';
const STORAGE_KEY_CURRENT = 'quickyai_current_conversation';

export function useQuickyAI() {
  // Models
  const [models, setModels] = useState<AIModel[]>([]);
  const [modelGroups, setModelGroups] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Conversations
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);

  // Activities
  const [activities, setActivities] = useState<AIActivity[]>([]);

  // Settings
  const [settings, setSettings] = useState<AISettings>({
    temperature: 0.7,
    maxTokens: 2048,
    streamingEnabled: true,
    autoSaveConversations: true,
  });

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<AIBookmark[]>([]);

  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<AIActivity | null>(null);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load data on mount
  useEffect(() => {
    loadModels();
    loadConversations();
    loadSettings();
    loadBookmarks();
  }, []);

  // Load models
  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const [allModels, grouped, recommended] = await Promise.all([
        fetchModels(),
        getModelsByProvider(),
        getRecommendedModels(),
      ]);
      
      setModels(allModels);
      setModelGroups(grouped);
      
      // Set default models if not already set
      if (!settings.defaultChatModel && recommended.chat) {
        updateSettings({ defaultChatModel: recommended.chat.id });
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load conversations from storage
  const loadConversations = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
      }

      const currentId = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (currentId && stored) {
        const parsed = JSON.parse(stored);
        const current = parsed.find((c: AIConversation) => c.id === currentId);
        if (current) setCurrentConversation(current);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Save conversations to storage
  const saveConversations = useCallback((convs: AIConversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(convs));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }, []);

  // Load settings
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Update settings
  const updateSettings = (newSettings: Partial<AISettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
      return updated;
    });
  };

  // Load bookmarks
  const loadBookmarks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  // Save bookmarks
  const saveBookmarks = (marks: AIBookmark[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(marks));
      setBookmarks(marks);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  };

  // Create new conversation
  const createConversation = (model: string, title: string = 'New Conversation') => {
    const modelObj = models.find((m) => m.id === model);
    const newConv: AIConversation = {
      id: `conv-${Date.now()}`,
      title,
      messages: [],
      model,
      provider: modelObj?.provider || 'custom',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { totalTokens: 0, estimatedCost: 0 },
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    setCurrentConversation(newConv);
    saveConversations(updated);
    localStorage.setItem(STORAGE_KEY_CURRENT, newConv.id);
    
    return newConv;
  };

  // Send message
  const sendMessage = async (
    content: string,
    images?: string[]
  ) => {
    if (!currentConversation) {
      throw new Error('No active conversation');
    }

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      images,
    };

    // Add user message
    const updatedConv = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: Date.now(),
    };
    setCurrentConversation(updatedConv);

    // Create activity
    const activity: AIActivity = {
      id: `activity-${Date.now()}`,
      type: 'chat',
      model: currentConversation.model,
      provider: currentConversation.provider,
      status: 'processing',
      timestamp: Date.now(),
      metadata: { prompt: content },
    };
    setCurrentActivity(activity);
    setActivities((prev) => [activity, ...prev]);

    setIsProcessing(true);

    try {
      const request: AIGenerationRequest = {
        model: currentConversation.model,
        prompt: content,
        options: {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          stream: settings.streamingEnabled,
          images,
        },
      };

      let assistantContent = '';
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: currentConversation.model,
      };

      const response = await chatCompletion(request, (chunk) => {
        assistantContent += chunk;
        assistantMessage.content = assistantContent;
        
        // Update conversation with streaming content
        setCurrentConversation((prev) => {
          if (!prev) return prev;
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            messages[messages.length - 1] = { ...assistantMessage };
          } else {
            messages.push({ ...assistantMessage });
          }
          return { ...prev, messages };
        });
      });

      // Final update
      assistantMessage.content = response.content;
      assistantMessage.tokens = response.tokens;
      if (response.error) assistantMessage.error = response.error;

      const finalConv = {
        ...updatedConv,
        messages: [...updatedConv.messages, assistantMessage],
        updatedAt: Date.now(),
        metadata: {
          ...updatedConv.metadata,
          totalTokens: (updatedConv.metadata?.totalTokens || 0) + (response.tokens?.total || 0),
          estimatedCost: (updatedConv.metadata?.estimatedCost || 0) + 
            calculateCost(
              response.tokens?.input || 0,
              response.tokens?.output || 0,
              models.find((m) => m.id === currentConversation.model)?.pricing
            ),
        },
      };

      setCurrentConversation(finalConv);
      
      // Update conversations list
      const updatedConvs = conversations.map((c) =>
        c.id === finalConv.id ? finalConv : c
      );
      setConversations(updatedConvs);
      if (settings.autoSaveConversations) {
        saveConversations(updatedConvs);
      }

      // Update activity
      const updatedActivity = {
        ...activity,
        status: response.error ? 'error' : 'completed',
        result: response,
        error: response.error,
        metadata: {
          ...activity.metadata,
          tokens: response.tokens?.total,
          cost: calculateCost(
            response.tokens?.input || 0,
            response.tokens?.output || 0,
            models.find((m) => m.id === currentConversation.model)?.pricing
          ),
        },
      } as AIActivity;
      setCurrentActivity(updatedActivity);
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? updatedActivity : a))
      );

      return response;
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      const errorActivity = {
        ...activity,
        status: 'error',
        error: error.message,
      } as AIActivity;
      setCurrentActivity(errorActivity);
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? errorActivity : a))
      );

      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete conversation
  const deleteConversation = (conversationId: string) => {
    const updated = conversations.filter((c) => c.id !== conversationId);
    setConversations(updated);
    saveConversations(updated);
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      localStorage.removeItem(STORAGE_KEY_CURRENT);
    }
  };

  // Export conversation
  const exportConversation = (conversation: AIConversation, format: 'json' | 'md' | 'txt' = 'json') => {
    let content = '';
    let mimeType = 'application/json';
    let extension = 'json';

    if (format === 'json') {
      content = JSON.stringify(conversation, null, 2);
    } else if (format === 'md') {
      content = `# ${conversation.title}\n\n`;
      content += `**Model:** ${conversation.model}\n`;
      content += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n\n`;
      conversation.messages.forEach((msg) => {
        content += `## ${msg.role === 'user' ? 'You' : 'Assistant'}\n\n`;
        content += `${msg.content}\n\n`;
      });
      mimeType = 'text/markdown';
      extension = 'md';
    } else {
      content = `${conversation.title}\n${'='.repeat(conversation.title.length)}\n\n`;
      conversation.messages.forEach((msg) => {
        content += `${msg.role === 'user' ? 'You' : 'Assistant'}:\n${msg.content}\n\n`;
      });
      mimeType = 'text/plain';
      extension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add bookmark
  const addBookmark = (conversationId: string, messageId: string, title: string) => {
    const bookmark: AIBookmark = {
      id: `bookmark-${Date.now()}`,
      conversationId,
      messageId,
      title,
      createdAt: Date.now(),
    };
    saveBookmarks([...bookmarks, bookmark]);
  };

  // Remove bookmark
  const removeBookmark = (bookmarkId: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Models
    models,
    modelGroups,
    isLoadingModels,
    loadModels,

    // Conversations
    conversations,
    currentConversation,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    exportConversation,

    // Messages
    sendMessage,
    isProcessing,

    // Activities
    activities,
    currentActivity,

    // Settings
    settings,
    updateSettings,

    // Bookmarks
    bookmarks,
    addBookmark,
    removeBookmark,

    // AI Actions
    generateImage: async (req: AIImageGenerationRequest) => {
      const activity: AIActivity = {
        id: `activity-${Date.now()}`,
        type: 'image',
        model: req.model,
        provider: 'openai',
        status: 'processing',
        timestamp: Date.now(),
        metadata: { prompt: req.prompt },
      };
      setCurrentActivity(activity);
      setActivities((prev) => [activity, ...prev]);

      try {
        const result = await generateImage(req);
        const updated = { ...activity, status: result.error ? 'error' : 'completed', result } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        return result;
      } catch (error: any) {
        const updated = { ...activity, status: 'error', error: error.message } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        throw error;
      }
    },

    analyzeImage: async (model: string, imageUrl: string, prompt: string) => {
      const activity: AIActivity = {
        id: `activity-${Date.now()}`,
        type: 'ocr',
        model,
        provider: 'openai',
        status: 'processing',
        timestamp: Date.now(),
      };
      setCurrentActivity(activity);
      setActivities((prev) => [activity, ...prev]);

      try {
        const result = await analyzeImage(model, imageUrl, prompt);
        const updated = { ...activity, status: result.error ? 'error' : 'completed', result } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        return result;
      } catch (error: any) {
        const updated = { ...activity, status: 'error', error: error.message } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        throw error;
      }
    },

    textToSpeech: async (req: AIVoiceRequest) => {
      const activity: AIActivity = {
        id: `activity-${Date.now()}`,
        type: 'voice',
        model: req.model || 'tts-1',
        provider: 'openai',
        status: 'processing',
        timestamp: Date.now(),
      };
      setCurrentActivity(activity);
      setActivities((prev) => [activity, ...prev]);

      try {
        const result = await textToSpeech(req);
        const updated = { ...activity, status: result.error ? 'error' : 'completed', result } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        return result;
      } catch (error: any) {
        const updated = { ...activity, status: 'error', error: error.message } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        throw error;
      }
    },

    speechToText: async (req: AITranscriptionRequest) => {
      const activity: AIActivity = {
        id: `activity-${Date.now()}`,
        type: 'transcription',
        model: req.model || 'whisper-1',
        provider: 'openai',
        status: 'processing',
        timestamp: Date.now(),
      };
      setCurrentActivity(activity);
      setActivities((prev) => [activity, ...prev]);

      try {
        const result = await speechToText(req);
        const updated = { ...activity, status: result.error ? 'error' : 'completed', result } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        return result;
      } catch (error: any) {
        const updated = { ...activity, status: 'error', error: error.message } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        throw error;
      }
    },

    generateVideo: async (req: AIVideoGenerationRequest) => {
      const activity: AIActivity = {
        id: `activity-${Date.now()}`,
        type: 'video',
        model: req.model || 'sora',
        provider: 'openai',
        status: 'processing',
        timestamp: Date.now(),
        metadata: { prompt: req.prompt },
      };
      setCurrentActivity(activity);
      setActivities((prev) => [activity, ...prev]);

      try {
        const result = await generateVideo(req);
        const updated = { ...activity, status: result.error ? 'error' : 'completed', result } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        return result;
      } catch (error: any) {
        const updated = { ...activity, status: 'error', error: error.message } as AIActivity;
        setCurrentActivity(updated);
        setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
        throw error;
      }
    },
  };
}
