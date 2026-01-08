import { useEffect, useRef, useCallback } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { WindowPosition, WindowSize } from '../types/window';

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

  const window = useWindowStore((state) => state.windows[windowId]);
  const startResize = useWindowStore((state) => state.startResize);
  const endResize = useWindowStore((state) => state.endResize);
  const updateWindowPosition = useWindowStore((state) => state.updateWindowPosition);
  const updateWindowSize = useWindowStore((state) => state.updateWindowSize);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      if (!enabled || !window || window.isMaximized || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      isResizingRef.current = true;
      mouseStartPositionRef.current = { x: e.clientX, y: e.clientY };

      startResize(
        windowId,
        handle,
        window.size,
        window.position
      );
      focusWindow(windowId);
      onResizeStart?.();
    },
    [enabled, window, windowId, startResize, focusWindow, onResizeStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizingRef.current || !window) return;

      const deltaX = e.clientX - mouseStartPositionRef.current.x;
      const deltaY = e.clientY - mouseStartPositionRef.current.y;

      const handle = window.resizeHandle || 'se';
      const originalSize = window.originalSize || window.size;
      const originalPosition = window.originalPosition || window.position;

      let newPosition = { ...originalPosition };
      let newSize = { ...originalSize };

      // Calculate new position and size based on handle
      switch (handle) {
        case 'nw':
          newPosition.x = originalPosition.x + deltaX;
          newPosition.y = originalPosition.y + deltaY;
          newSize.width = originalSize.width - deltaX;
          newSize.height = originalSize.height - deltaY;
          break;
        case 'n':
          newPosition.y = originalPosition.y + deltaY;
          newSize.height = originalSize.height - deltaY;
          break;
        case 'ne':
          newPosition.y = originalPosition.y + deltaY;
          newSize.width = originalSize.width + deltaX;
          newSize.height = originalSize.height - deltaY;
          break;
        case 'e':
          newSize.width = originalSize.width + deltaX;
          break;
        case 'se':
          newSize.width = originalSize.width + deltaX;
          newSize.height = originalSize.height + deltaY;
          break;
        case 's':
          newSize.height = originalSize.height + deltaY;
          break;
        case 'sw':
          newPosition.x = originalPosition.x + deltaX;
          newSize.width = originalSize.width - deltaX;
          newSize.height = originalSize.height + deltaY;
          break;
        case 'w':
          newPosition.x = originalPosition.x + deltaX;
          newSize.width = originalSize.width - deltaX;
          break;
      }

      // Update position if it changed
      if (newPosition.x !== originalPosition.x || newPosition.y !== originalPosition.y) {
        updateWindowPosition(windowId, newPosition.x, newPosition.y);
      }

      // Update size if it changed
      if (newSize.width !== originalSize.width || newSize.height !== originalSize.height) {
        updateWindowSize(windowId, newSize.width, newSize.height);
      }
    },
    [window, windowId, updateWindowPosition, updateWindowSize]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizingRef.current) {
      isResizingRef.current = false;
      endResize(windowId);
      onResizeEnd?.();
    }
  }, [windowId, endResize, onResizeEnd]);

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
    isResizing: window?.isResizing || false,
  };
};
