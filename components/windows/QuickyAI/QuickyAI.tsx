'use client';

import React from 'react';

export interface QuickyAIProps {
  windowId?: string;
  onClose?: () => void;
}

export function QuickyAI({ windowId, onClose }: QuickyAIProps) {
  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <span className="text-purple-400 font-bold text-sm">⚡</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Quicky AI</h2>
            <p className="text-xs text-gray-500">Coming in Phase 2</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto">
            <span className="text-purple-400 text-2xl">⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Quicky AI</h3>
            <p className="text-gray-400 text-sm max-w-md">
              This is a placeholder for Quicky AI functionality. 
              Phase 2 will include advanced AI features and integrations.
            </p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 max-w-sm">
            <p className="text-xs text-purple-300">
              🚧 Under construction - Phase 2 features coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}