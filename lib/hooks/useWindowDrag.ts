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

  const window = useWindowStore((state) => state.windows[windowId]);
  const startDrag = useWindowStore((state) => state.startDrag);
  const endDrag = useWindowStore((state) => state.endDrag);
  const updateWindowPosition = useWindowStore((state) => state.updateWindowPosition);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !window || window.isMaximized || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragStartPositionRef.current = { x: window.position.x, y: window.position.y };
      mouseStartPositionRef.current = { x: e.clientX, y: e.clientY };

      const offsetX = e.clientX - window.position.x;
      const offsetY = e.clientY - window.position.y;

      startDrag(windowId, offsetX, offsetY);
      focusWindow(windowId);
      onDragStart?.();
    },
    [enabled, window, windowId, startDrag, focusWindow, onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !window) return;

      const deltaX = e.clientX - mouseStartPositionRef.current.x;
      const deltaY = e.clientY - mouseStartPositionRef.current.y;

      const newX = dragStartPositionRef.current.x + deltaX;
      const newY = dragStartPositionRef.current.y + deltaY;

      updateWindowPosition(windowId, newX, newY);
    },
    [window, windowId, updateWindowPosition]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      endDrag(windowId);
      onDragEnd?.();
    }
  }, [windowId, endDrag, onDragEnd]);

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
    isDragging: window?.isDragging || false,
  };
};
