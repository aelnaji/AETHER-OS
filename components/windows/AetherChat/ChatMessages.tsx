'use client';

import React, { useRef, useEffect } from 'react';
import { Bot, User, Terminal, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { MessageBubble, ToolCallResult } from '@/lib/types/chat';

interface ChatMessagesProps {
  messages: MessageBubble[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
            <Bot size={32} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Chat with A.E
          </h3>
          <p className="text-gray-400 text-sm">
            Your AI assistant for AETHER OS. Ask me to install apps, open programs, run commands, or help with any task.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubbleComponent key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm px-4">
          <Loader2 size={16} className="animate-spin" />
          <span>A.E is thinking...</span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubbleComponent({ message }: { message: MessageBubble }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-gray-700'
            : 'bg-gradient-to-br from-amber-500/20 to-rose-500/20'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-gray-300" />
        ) : (
          <Bot size={16} className="text-amber-400" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gray-800 text-white rounded-tr-sm'
              : 'bg-transparent text-gray-200'
          }`}
        >
          {message.content && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          )}

          {/* Tool Calls Display */}
          {message.toolResults && message.toolResults.length > 0 && (
            <ToolResultsDisplay results={message.toolResults} />
          )}
        </div>

        {/* Loading indicator for assistant */}
        {message.isLoading && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-gray-500">A.E is typing</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-600 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

function ToolResultsDisplay({ results }: { results: ToolCallResult[] }) {
  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      {results.map((result, index) => (
        <div
          key={result.id || index}
          className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
        >
          {result.success ? (
            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Terminal size={12} className="text-amber-400" />
              <span className="text-xs font-medium text-amber-400">{result.name}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 break-words">
              {result.error || result.output || 'Executed successfully'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
