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

  const rafRef = useRef<number | null>(null);
  const latestPositionRef = useRef<{ x: number; y: number } | null>(null);

  const win = useWindowStore((state) => state.windows[windowId]);
  const startDrag = useWindowStore((state) => state.startDrag);
  const endDrag = useWindowStore((state) => state.endDrag);
  const updateWindowPosition = useWindowStore((state) => state.updateWindowPosition);
  const focusWindow = useWindowStore((state) => state.focusWindow);

  const flush = useCallback(() => {
    if (!latestPositionRef.current) return;
    updateWindowPosition(windowId, latestPositionRef.current.x, latestPositionRef.current.y);
  }, [updateWindowPosition, windowId]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !win || win.isMaximized || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragStartPositionRef.current = { x: win.position.x, y: win.position.y };
      mouseStartPositionRef.current = { x: e.clientX, y: e.clientY };

      const offsetX = e.clientX - win.position.x;
      const offsetY = e.clientY - win.position.y;

      startDrag(windowId, offsetX, offsetY);
      focusWindow(windowId);
      onDragStart?.();
    },
    [enabled, win, windowId, startDrag, focusWindow, onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !win) return;

      const deltaX = e.clientX - mouseStartPositionRef.current.x;
      const deltaY = e.clientY - mouseStartPositionRef.current.y;

      latestPositionRef.current = {
        x: dragStartPositionRef.current.x + deltaX,
        y: dragStartPositionRef.current.y + deltaY,
      };

      if (rafRef.current) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        flush();
      });
    },
    [win, flush]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;

    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    flush();
    endDrag(windowId);
    onDragEnd?.();
  }, [windowId, endDrag, onDragEnd, flush]);

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
    isDragging: win?.isDragging || false,
  };
};
