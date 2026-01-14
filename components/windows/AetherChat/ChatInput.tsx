'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSubmit();
      onChange('');
    }
  };

  const getPlaceholder = () => {
    if (disabled) return 'Configure your API settings first...';
    if (isLoading) return 'A.E is thinking...';
    return 'Ask A.E anything...';
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Input Card */}
      <div
        className={`relative bg-[#1a1a1a] rounded-2xl border transition-all duration-300 ${
          isFocused
            ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
            : 'border-white/10 hover:border-white/20'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={getPlaceholder()}
            disabled={isLoading || disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none max-h-[120px] min-h-[24px] disabled:cursor-not-allowed"
            style={{ height: 'auto' }}
          />

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading || disabled}
            className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${
              value.trim() && !isLoading && !disabled
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : disabled ? (
              <AlertCircle size={18} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        {/* Glass Effect Overlay */}
        <div
          className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${
            isFocused ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.1) 100%)',
            backdropFilter: 'blur(12px)',
          }}
        />
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
        <span>Enter to send</span>
        <span>•</span>
        <span>Shift + Enter for new line</span>
      </div>
    </div>
  );
}
