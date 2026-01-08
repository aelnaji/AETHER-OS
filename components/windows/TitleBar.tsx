'use client';

import React from 'react';
import { Minus, Square, Maximize2, X } from 'lucide-react';
import { useWindowStore } from '@/lib/stores/windowStore';

interface TitleBarProps {
  windowId: string;
  title: string;
  isFocused: boolean;
  isMaximized: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  minimizable?: boolean;
  maximizable?: boolean;
  closeable?: boolean;
}

export function TitleBar({
  windowId,
  title,
  isFocused,
  isMaximized,
  onDragStart,
  minimizable = true,
  maximizable = true,
  closeable = true,
}: TitleBarProps) {
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const restoreFromMaximize = useWindowStore((state) => state.restoreFromMaximize);
  const closeWindow = useWindowStore((state) => state.closeWindow);

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    minimizeWindow(windowId);
  };

  const handleMaximizeRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) {
      restoreFromMaximize(windowId);
    } else {
      maximizeWindow(windowId);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeWindow(windowId);
  };

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 cursor-default select-none transition-colors ${
        isFocused
          ? 'bg-[#1a1a1a] border-b border-white/10'
          : 'bg-[#151515] border-b border-white/5'
      }`}
      onMouseDown={onDragStart}
    >
      {/* Window Title */}
      <h3
        className={`text-sm font-medium truncate ${
          isFocused ? 'text-white' : 'text-gray-400'
        }`}
      >
        {title}
      </h3>

      {/* Window Controls */}
      <div className="flex items-center gap-1">
        {minimizable && (
          <button
            onClick={handleMinimize}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
            title="Minimize"
          >
            <Minus size={14} className="text-gray-400 group-hover:text-white" />
          </button>
        )}

        {maximizable && (
          <button
            onClick={handleMaximizeRestore}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Square size={14} className="text-gray-400 group-hover:text-white" />
            ) : (
              <Maximize2 size={14} className="text-gray-400 group-hover:text-white" />
            )}
          </button>
        )}

        {closeable && (
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors group"
            title="Close"
          >
            <X size={14} className="text-gray-400 group-hover:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}
