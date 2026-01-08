'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MessageBubble, ChatSession, ToolCall } from '@/lib/types/chat';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { logger } from '@/lib/utils/logger';

interface UseAetherChatReturn {
  messages: MessageBubble[];
  isLoading: boolean;
  error: string | null;
  model: string;
  setModel: (model: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  chatHistory: ChatSession[];
  loadChatSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

const CHAT_HISTORY_KEY = 'aether-chat-history';
const CURRENT_SESSION_KEY = 'aether-current-session';

const DEFAULT_MODEL = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'meta/llama-3.1-405b-instruct';

export function useAetherChat(): UseAetherChatReturn {
  const [messages, setMessages] = useState<MessageBubble[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const { llmSettings, isConfigured } = useSettingsStore();
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const history = JSON.parse(saved);
        setChatHistory(history);
      }
      
      const currentSession = localStorage.getItem(CURRENT_SESSION_KEY);
      if (currentSession) {
        const session = JSON.parse(currentSession);
        setMessages(session.messages || []);
        setCurrentSessionId(session.id);
      }
    } catch (e) {
      logger.warn('Failed to load chat history', e);
    }
  }, []);

  // Save current session to localStorage
  const saveCurrentSession = useCallback((msgs: MessageBubble[]) => {
    if (currentSessionId) {
      try {
        localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
          id: currentSessionId,
          messages: msgs,
        }));
      } catch (e) {
        logger.warn('Failed to save current session', e);
      }
    }
  }, [currentSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const createNewSession = (firstMessage: string): ChatSession => {
    const title = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    
    const session: ChatSession = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentSessionId(session.id);
    return session;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Check if settings are configured
    if (!isConfigured || !llmSettings.apiKey) {
      setError('Please configure your NVIDIA API key in Settings before chatting with A.E');
      return;
    }

    const userMessage: MessageBubble = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
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

    // Save the user message to current session
    saveCurrentSession(newMessages);

    // Add loading message placeholder
    const loadingMessage: MessageBubble = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...newMessages, loadingMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-nvidia-api-key': llmSettings.apiKey,
          'x-nvidia-model': llmSettings.model,
          'x-nvidia-temperature': llmSettings.temperature.toString(),
          'x-nvidia-max-tokens': llmSettings.maxTokens.toString(),
          'x-nvidia-system-prompt': llmSettings.systemPrompt,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: llmSettings.model,
          includeTools: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to read response');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let toolCalls: ToolCall[] = [];
      let currentToolCallId = '';
      let currentToolName = '';
      let currentToolArgs = '';

      // Remove loading message and add real one
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        const assistantMsg: MessageBubble = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          toolCalls: [],
        };
        return [...filtered, assistantMsg];
      });

      // Get the latest message ID for updates
      setMessages((prev) => {
        const latestMsg = prev[prev.length - 1];
        if (latestMsg && latestMsg.role === 'assistant' && latestMsg.isLoading === undefined) {
          latestMsg.isLoading = true;
        }
        return [...prev];
      });

      let latestMessageId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            
            if (dataStr === '[DONE]') {
              // Execute tool calls if any
              if (toolCalls.length > 0) {
                const results = await executeToolCalls(toolCalls);
                setMessages((prev) => {
                  const updated = prev.map((m) => {
                    if (m.id === latestMessageId) {
                      return {
                        ...m,
                        content: assistantContent + `\n\n${formatToolResults(results)}`,
                        toolResults: results,
                        isLoading: false,
                      };
                    }
                    return m;
                  });
                  saveCurrentSession(updated);
                  return updated;
                });
              } else {
                setMessages((prev) => {
                  const updated = prev.map((m) => {
                    if (m.id === latestMessageId) {
                      return { ...m, content: assistantContent, isLoading: false };
                    }
                    return m;
                  });
                  saveCurrentSession(updated);
                  return updated;
                });
              }
              break;
            }

            try {
              const event = JSON.parse(dataStr);
              
              if (event.type === 'chunk' && event.data?.choices?.[0]?.delta) {
                const delta = event.data.choices[0].delta;
                
                // Set message ID on first chunk
                if (!latestMessageId) {
                  setMessages((prev) => {
                    const newMsg: MessageBubble = {
                      id: generateId(),
                      role: 'assistant',
                      content: delta.content || '',
                      timestamp: new Date(),
                      isLoading: true,
                    };
                    // Remove loading placeholder
                    const filtered = prev.filter((m) => !m.isLoading || m.role === 'user');
                    latestMessageId = newMsg.id;
                    return [...filtered, newMsg];
                  });
                }

                // Handle content
                if (delta.content) {
                  assistantContent += delta.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === latestMessageId
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }

                // Handle tool calls
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    if (!currentToolCallId || tc.id !== currentToolCallId) {
                      if (currentToolCallId && currentToolName) {
                        toolCalls.push({
                          id: currentToolCallId,
                          type: 'function',
                          function: {
                            name: currentToolName,
                            arguments: currentToolArgs,
                          },
                        });
                      }
                      currentToolCallId = tc.id;
                      currentToolName = tc.function?.name || '';
                      currentToolArgs = tc.function?.arguments || '';
                    } else {
                      currentToolArgs += tc.function?.arguments || '';
                    }
                  }
                }
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Save final state
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === latestMessageId
            ? { ...m, content: assistantContent, isLoading: false }
            : m
        );
        saveCurrentSession(updated);
        
        // Update chat history
        setChatHistory((history) =>
          history.map((s) =>
            s.id === sessionId
              ? { ...s, messages: updated, updatedAt: new Date() }
              : s
          )
        );
        
        return updated;
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      // Remove loading message on error
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        saveCurrentSession(filtered);
        return filtered;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, model, currentSessionId, saveCurrentSession]);

  const executeToolCalls = async (toolCalls: ToolCall[]): Promise<{ id: string; name: string; arguments: string; success?: boolean; output?: string; error?: string }[]> => {
    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolCalls: toolCalls.map((tc) => ({
            name: tc.function.name,
            arguments: tc.function.arguments,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute tools');
      }

      const results = await response.json();
      return results.map((r: any) => ({
        id: r.toolName,
        name: r.toolName,
        arguments: '',
        success: r.success,
        output: r.output,
        error: r.error,
      }));
    } catch (error) {
      return toolCalls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }, []);

  const loadChatSession = useCallback((sessionId: string) => {
    const session = chatHistory.find((s) => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify({
        id: sessionId,
        messages: session.messages,
      }));
    }
  }, [chatHistory]);

  return {
    messages,
    isLoading,
    error,
    model,
    setModel,
    sendMessage,
    clearChat,
    chatHistory,
    loadChatSession,
    currentSessionId,
  };
}

function formatToolResults(results: Array<{ name: string; output?: string; error?: string }>): string {
  if (results.length === 0) return '';

  return results
    .map((r) => {
      const status = r.error ? '❌' : '✅';
      const text = r.error || r.output || 'Completed';
      return `${status} \`${r.name}\`: ${text}`;
    })
    .join('\n');
}
