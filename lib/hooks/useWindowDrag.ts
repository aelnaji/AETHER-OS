import { useEffect, useRef, useCallback } from 'react';
import { useWindowStore } from '../stores/windowStore';

interface UseWindowDragOptions {
  windowId: string;
  enabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const useWindowDrag = ({
  windowId,
  enabled = true,
  onDragStart,
  onDragEnd,
}: UseWindowDragOptions) => {
  const isDraggingRef = useRef(false);
  const dragStartPositionRef = useRef({ x: 0, y: 0 });
  const mouseStartPositionRef = useRef({ x: 0, y: 0 });

  const windowState = useWindowStore((state) => state.windows[windowId]);
  const startDrag = useWindowStore((state) => state.startDrag);
  const endDrag = useWindowStore((state) => state.endDrag);
  const updateWindowPosition = useWindowStore((state) => state.updateWindowPosition);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !windowState || windowState.isMaximized || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragStartPositionRef.current = { x: windowState.position.x, y: windowState.position.y };
      mouseStartPositionRef.current = { x: e.clientX, y: e.clientY };

      const offsetX = e.clientX - windowState.position.x;
      const offsetY = e.clientY - windowState.position.y;

      startDrag(windowId, offsetX, offsetY);
      focusWindow(windowId);
      onDragStart?.();
    },
    [enabled, windowState, windowId, startDrag, focusWindow, onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !windowState) return;

      const deltaX = e.clientX - mouseStartPositionRef.current.x;
      const deltaY = e.clientY - mouseStartPositionRef.current.y;

      const newX = dragStartPositionRef.current.x + deltaX;
      const newY = dragStartPositionRef.current.y + deltaY;

      updateWindowPosition(windowId, newX, newY);
    },
    [windowState, windowId, updateWindowPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      endDrag(windowId);
      onDragEnd?.();
    }
  }, [windowId, endDrag, onDragEnd]);

  useEffect(() => {
    if (!enabled || typeof globalThis.window === 'undefined') return;

    globalThis.window.addEventListener('mousemove', handleMouseMove);
    globalThis.window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.removeEventListener('mousemove', handleMouseMove);
        globalThis.window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [enabled, handleMouseMove, handleMouseUp]);

  return {
    onMouseDown: handleMouseDown,
    isDragging: windowState?.isDragging || false,
  };
};
