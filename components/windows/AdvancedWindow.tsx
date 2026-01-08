'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowStore } from '@/lib/stores/windowStore';
import { useWindowDrag } from '@/lib/hooks/useWindowDrag';
import { useWindowResize } from '@/lib/hooks/useWindowResize';
import { TitleBar } from './TitleBar';
import { ResizeHandles } from './ResizeHandles';

interface AdvancedWindowProps {
  windowId: string;
  children: React.ReactNode;
  minimizable?: boolean;
  maximizable?: boolean;
  closeable?: boolean;
  resizable?: boolean;
}

export function AdvancedWindow({
  windowId,
  children,
  minimizable = true,
  maximizable = true,
  closeable = true,
  resizable = true,
}: AdvancedWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const window = useWindowStore((state) => state.windows[windowId]);
  const focusedWindowId = useWindowStore((state) => state.focusedWindowId);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const isFocused = focusedWindowId === windowId;

  const { onMouseDown: handleDragStart } = useWindowDrag({
    windowId,
    enabled: true,
  });

  const { onMouseDown: handleResizeStart } = useWindowResize({
    windowId,
    enabled: resizable,
  });

  const handleWindowClick = () => {
    if (!isFocused) {
      focusWindow(windowId);
    }
  };

  useEffect(() => {
    if (windowRef.current && isFocused) {
      windowRef.current.focus();
    }
  }, [isFocused]);

  if (!window) return null;

  const translate = `translate3d(${window.position.x}px, ${window.position.y}px, 0)`;
  const scale = window.isMinimized ? 'scale(0.9)' : 'scale(1)';

  const windowStyle = {
    left: 0,
    top: 0,
    width: window.size.width,
    height: window.size.height,
    zIndex: window.zIndex,
    transform: `${translate} ${scale}`,
    opacity: window.isMinimized ? 0 : 1,
    pointerEvents: window.isMinimized ? 'none' : 'auto',
    willChange: window.isDragging || window.isResizing ? ('transform' as const) : undefined,
  };

  return (
    <div
      ref={windowRef}
      id={windowId}
      className={`absolute bg-[#171717] border rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ease-out ${
        isFocused
          ? 'border-amber-500/30 shadow-amber-500/10'
          : 'border-white/10'
      } ${window.isMaximized ? 'rounded-none' : ''} ${
        window.isDragging ? 'cursor-grabbing' : ''
      }`}
      style={windowStyle}
      onClick={handleWindowClick}
      tabIndex={-1}
    >
      {/* Title Bar */}
      <TitleBar
        windowId={windowId}
        title={window.title}
        isFocused={isFocused}
        isMaximized={window.isMaximized}
        onDragStart={handleDragStart}
        minimizable={minimizable}
        maximizable={maximizable}
        closeable={closeable}
      />

      {/* Content Area */}
      <div
        className="overflow-auto"
        style={{
          height: `calc(100% - 52px)`, // Subtract title bar height
        }}
      >
        {children}
      </div>

      {/* Resize Handles */}
      {resizable && !window.isMaximized && (
        <ResizeHandles windowId={windowId} onMouseDown={handleResizeStart} />
      )}
    </div>
  );
}
