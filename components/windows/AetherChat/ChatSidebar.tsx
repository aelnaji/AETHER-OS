'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useAetherChat } from '@/lib/hooks/useAetherChat';
import { ChatSession } from '@/lib/types/chat';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const { chatHistory, loadChatSession, clearChat, currentSessionId } = useAetherChat();
  const [confirmClear, setConfirmClear] = useState(false);

  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const handleNewChat = () => {
    clearChat();
    onClose();
  };

  const handleClearHistory = () => {
    if (confirmClear) {
      clearChat();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    loadChatSession(session.id);
    onClose();
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-[#171717] border-r border-white/5 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0`}
    >
      <div className="flex flex-col h-full">
        {/* New Chat Button */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-medium transition-colors duration-200"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Recent Chats</span>
              <button
                onClick={handleClearHistory}
                className={`p-1.5 rounded-lg transition-colors ${
                  confirmClear
                    ? 'bg-red-500/20 text-red-400'
                    : 'hover:bg-white/5 text-gray-500'
                }`}
                title={confirmClear ? 'Click to confirm clear' : 'Clear all chats'}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {chatHistory.length === 0 ? (
                <div className="px-3 py-8 text-center text-gray-500 text-sm">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No chats yet</p>
                  <p className="text-xs mt-1">Start a conversation with A.E</p>
                </div>
              ) : (
                chatHistory.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-200 ${
                      currentSessionId === session.id
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock size={10} />
                        <span>{formatTimestamp(session.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>AETHER OS</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden -z-10"
          onClick={onClose}
        />
      )}
    </aside>
  );
}
