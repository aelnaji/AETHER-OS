'use client';

import React, { useRef, useEffect } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/lib/services/fileService';

interface ChatMessagesProps {
  messages: ChatMessage[];
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
            Your AI assistant for AETHER OS. Ask me to help with tasks, answer questions, or assist with your work.
          </p>
          {!isLoading && (
            <div className="mt-6 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              💡 Tip: Configure your API settings first to start chatting
            </div>
          )}
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

function MessageBubbleComponent({ message }: { message: ChatMessage }) {
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
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-600 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {message.tokens && (
            <span className="ml-2 text-gray-500">
              ({message.tokens} tokens)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
