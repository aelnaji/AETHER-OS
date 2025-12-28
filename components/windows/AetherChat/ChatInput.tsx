'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Sparkles, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  model: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  model,
  onModelChange,
  availableModels,
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
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
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit();
      onChange('');
    }
  };

  const formatModelName = (modelId: string) => {
    const parts = modelId.split('/');
    if (parts.length === 2) {
      const [org, name] = parts;
      const shortName = name.replace(/-instruct$/, '').replace(/-\d+b$/, '');
      return `${org}/${shortName}`;
    }
    return modelId;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Model Selector */}
      <div className="relative mb-2">
        <button
          onClick={() => setShowModelDropdown(!showModelDropdown)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Sparkles size={12} className="text-amber-400" />
          <span>{formatModelName(model)}</span>
          <ChevronDown size={12} className={`transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showModelDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowModelDropdown(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/5">
                Select Model
              </div>
              {availableModels.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onModelChange(m);
                    setShowModelDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    model === m
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {formatModelName(m)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Input Card */}
      <div
        className={`relative bg-[#1a1a1a] rounded-2xl border transition-all duration-300 ${
          isFocused
            ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask A.E anything..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none focus:outline-none max-h-[120px] min-h-[24px]"
            style={{ height: 'auto' }}
          />

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${
              value.trim() && !isLoading
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
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
