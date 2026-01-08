import { useEffect, useRef, useCallback } from 'react';
import { useWindowStore } from '../stores/windowStore';

interface UseWindowResizeOptions {
  windowId: string;
  enabled?: boolean;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export const useWindowResize = ({
  windowId,
  enabled = true,
  onResizeStart,
  onResizeEnd,
}: UseWindowResizeOptions) => {
  const isResizingRef = useRef(false);
  const mouseStartPositionRef = useRef({ x: 0, y: 0 });

  const rafRef = useRef<number | null>(null);
  const latestRef = useRef<{
    position: { x: number; y: number };
    size: { width: number; height: number };
  } | null>(null);

  const win = useWindowStore((state) => state.windows[windowId]);
  const startResize = useWindowStore((state) => state.startResize);
  const endResize = useWindowStore((state) => state.endResize);
  const updateWindowPosition = useWindowStore((state) => state.updateWindowPosition);
  const updateWindowSize = useWindowStore((state) => state.updateWindowSize);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const flush = useCallback(() => {
    if (!latestRef.current || !win) return;

    const { position, size } = latestRef.current;

    if (position.x !== win.position.x || position.y !== win.position.y) {
      updateWindowPosition(windowId, position.x, position.y);
    }

    if (size.width !== win.size.width || size.height !== win.size.height) {
      updateWindowSize(windowId, size.width, size.height);
    }
  }, [updateWindowPosition, updateWindowSize, win, windowId]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      if (!enabled || !win || win.isMaximized || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      isResizingRef.current = true;
      mouseStartPositionRef.current = { x: e.clientX, y: e.clientY };

      startResize(windowId, handle, win.size, win.position);
      focusWindow(windowId);
      onResizeStart?.();
    },
    [enabled, win, windowId, startResize, focusWindow, onResizeStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizingRef.current || !win) return;

      const deltaX = e.clientX - mouseStartPositionRef.current.x;
      const deltaY = e.clientY - mouseStartPositionRef.current.y;

      const handle = win.resizeHandle || 'se';
      const originalSize = win.originalSize || win.size;
      const originalPosition = win.originalPosition || win.position;

      let position = { ...originalPosition };
      let size = { ...originalSize };

      switch (handle) {
        case 'nw':
          position = { x: originalPosition.x + deltaX, y: originalPosition.y + deltaY };
          size = { width: originalSize.width - deltaX, height: originalSize.height - deltaY };
          break;
        case 'n':
          position = { x: originalPosition.x, y: originalPosition.y + deltaY };
          size = { width: originalSize.width, height: originalSize.height - deltaY };
          break;
        case 'ne':
          position = { x: originalPosition.x, y: originalPosition.y + deltaY };
          size = { width: originalSize.width + deltaX, height: originalSize.height - deltaY };
          break;
        case 'e':
          size = { width: originalSize.width + deltaX, height: originalSize.height };
          break;
        case 'se':
          size = { width: originalSize.width + deltaX, height: originalSize.height + deltaY };
          break;
        case 's':
          size = { width: originalSize.width, height: originalSize.height + deltaY };
          break;
        case 'sw':
          position = { x: originalPosition.x + deltaX, y: originalPosition.y };
          size = { width: originalSize.width - deltaX, height: originalSize.height + deltaY };
          break;
        case 'w':
          position = { x: originalPosition.x + deltaX, y: originalPosition.y };
          size = { width: originalSize.width - deltaX, height: originalSize.height };
          break;
      }

      latestRef.current = { position, size };

      if (rafRef.current) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        flush();
      });
    },
    [win, flush]
  );

  const handleMouseUp = useCallback(() => {
    if (!isResizingRef.current) return;

    isResizingRef.current = false;

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    flush();
    endResize(windowId);
    onResizeEnd?.();
  }, [windowId, endResize, onResizeEnd, flush]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, handleMouseMove, handleMouseUp]);

  return {
    onMouseDown: handleMouseDown,
    isResizing: win?.isResizing || false,
  };
};
