'use client';

import React, { useState } from 'react';
import { Bot, Menu, X, Settings } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useAetherChat } from '@/lib/hooks/useAetherChat';

export function AetherChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const {
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
  } = useAetherChat();

  const availableModels = [
    'meta/llama-3.1-405b-instruct',
    'meta/llama-3.1-70b-instruct',
    'mistralai/mistral-large',
    'mistralai/mistral-7b-instruct-v0.1',
    'google/gemma-7b',
  ];

  const handleSubmit = async () => {
    if (inputValue.trim() && !isLoading) {
      await sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex h-full bg-[#0f0f0f]">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Menu size={20} className="text-gray-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
                <Bot size={18} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">A.E Chat</h1>
                <p className="text-xs text-gray-500">
                  {isLoading ? 'Thinking...' : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="New Chat"
            >
              <Bot size={18} className="text-gray-400 hover:text-amber-400 transition-colors" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Settings"
            >
              <Settings size={18} className="text-gray-400 hover:text-white transition-colors" />
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <div className="pt-2">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            model={model}
            onModelChange={setModel}
            availableModels={availableModels}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
