'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { sendMessage as apiSendMessage, ChatMessage } from '@/lib/services/apiService';
import { saveConversation, loadConversation, listConversations, Conversation, ChatMessage as FileChatMessage } from '@/lib/services/fileService';

interface UseAetherChatReturn {
  messages: FileChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  chatHistory: Conversation[];
  loadChatSession: (sessionId: string) => void;
  currentSessionId: string | null;
  saveCurrentConversation: () => Promise<void>;
}

const CURRENT_SESSION_KEY = 'aether-current-session';

export function useAetherChat(): UseAetherChatReturn {
  const [messages, setMessages] = useState<FileChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const { getAPISettings, isConfigured } = useSettingsStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate unique ID for messages
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
    loadCurrentSession();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save current session to localStorage whenever messages change
  useEffect(() => {
    if (currentSessionId) {
      try {
        localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
          id: currentSessionId,
          messages,
        }));
      } catch (e) {
        console.error('Failed to save current session:', e);
      }
    }
  }, [messages, currentSessionId]);

  const loadChatHistory = async () => {
    try {
      const result = await listConversations();
      if (result.success && result.data) {
        setChatHistory(result.data);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  };

  const loadCurrentSession = () => {
    try {
      const saved = localStorage.getItem(CURRENT_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        setMessages(session.messages || []);
        setCurrentSessionId(session.id);
      }
    } catch (e) {
      console.error('Failed to load current session:', e);
    }
  };

  const createNewSession = (firstMessage: string): Conversation => {
    const title = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    
    const session: Conversation = {
      id: generateId(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        baseUrl: getAPISettings().baseUrl,
        model: 'gpt-3.5-turbo', // Default model
      },
    };
    
    setCurrentSessionId(session.id);
    return session;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Check if settings are configured
    if (!isConfigured) {
      setError('Please configure your API settings before chatting with A.E');
      return;
    }

    const settings = getAPISettings();
    
    if (!settings.apiKey || !settings.baseUrl) {
      setError('API settings incomplete. Please check your configuration.');
      return;
    }

    const userMessage: FileChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = createNewSession(content.trim());
      setChatHistory((prev) => [newSession, ...prev]);
      sessionId = newSession.id;
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    // Add loading message placeholder
    const loadingMessage: FileChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: 'Thinking...',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...newMessages, loadingMessage]);

    try {
      // Prepare messages for API (convert to API format)
      const apiMessages: ChatMessage[] = [
        {
          role: 'system',
          content: settings.systemPrompt || 'You are A.E, a helpful AI assistant.'
        },
        ...newMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Send message to API
      const response = await apiSendMessage(apiMessages, settings);

      if (!response.success) {
        throw new Error(response.error || response.message);
      }

      // Create assistant message
      const assistantMessage: FileChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.data?.content || 'No response received',
        timestamp: Date.now(),
        tokens: response.data?.usage?.total_tokens,
      };

      // Remove loading message and add real response
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update chat history
      setChatHistory(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages: finalMessages, updatedAt: Date.now() }
          : session
      ));

      // Auto-save conversation
      const currentSession = chatHistory.find(s => s.id === sessionId);
      if (currentSession) {
        await saveConversation({
          ...currentSession,
          messages: finalMessages,
          updatedAt: Date.now(),
        });
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      // Remove loading message on error
      setMessages(prev => prev.filter(m => m.id !== loadingMessage.id));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, currentSessionId, chatHistory, getAPISettings, isConfigured]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }, []);

  const loadChatSession = useCallback(async (sessionId: string) => {
    try {
      const result = await loadConversation(sessionId);
      if (result.success && result.data) {
        setMessages(result.data.messages);
        setCurrentSessionId(sessionId);
        
        // Update chat history with loaded session
        setChatHistory(prev => 
          prev.map(s => s.id === sessionId ? result.data : s)
        );
      }
    } catch (error) {
      console.error('Failed to load chat session:', error);
      setError('Failed to load conversation');
    }
  }, [chatHistory]);

  const saveCurrentConversation = useCallback(async () => {
    if (!currentSessionId || messages.length === 0) return;

    try {
      const currentSession = chatHistory.find(s => s.id === currentSessionId);
      if (currentSession) {
        await saveConversation({
          ...currentSession,
          messages,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      setError('Failed to save conversation');
    }
  }, [currentSessionId, messages, chatHistory]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    chatHistory,
    loadChatSession,
    currentSessionId,
    saveCurrentConversation,
  };
}
