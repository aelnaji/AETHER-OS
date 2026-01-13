import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WindowState, WindowPosition, WindowSize } from '../types/window';

interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

interface ResizeState {
  isResizing: boolean;
  resizeHandle: string | null;
  originalSize: WindowSize;
  originalPosition: WindowPosition;
}

interface WindowExtendedState extends WindowState {
  isDragging?: boolean;
  dragOffset?: { x: number; y: number };
  isResizing?: boolean;
  resizeHandle?: string | null;
  originalSize?: WindowSize;
  originalPosition?: WindowPosition;
  previousState?: {
    position: WindowPosition;
    size: WindowSize;
  };
  minimizable?: boolean;
  maximizable?: boolean;
  closeable?: boolean;
  resizable?: boolean;
}

interface WindowManagerState {
  windows: Record<string, WindowExtendedState>;
  focusedWindowId: string | null;
  zIndexCounter: number;

  openWindow: (appId: string, title: string, config?: Partial<WindowExtendedState>) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreFromMaximize: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  bringToFront: (windowId: string) => void;
  startDrag: (windowId: string, offsetX: number, offsetY: number) => void;
  endDrag: (windowId: string) => void;
  startResize: (windowId: string, handle: string, originalSize: WindowSize, originalPosition: WindowPosition) => void;
  endResize: (windowId: string) => void;
  snapToGrid: (windowId: string, gridSize: number) => void;
  cascadeWindows: () => void;
  tileWindows: () => void;
  saveWindowState: () => void;
  loadWindowState: () => void;
}

const MIN_WINDOW_WIDTH = 300;
const MIN_WINDOW_HEIGHT = 200;
const DEFAULT_WINDOW_WIDTH = 800;
const DEFAULT_WINDOW_HEIGHT = 600;

const getViewportSize = () => {
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  return { width: 1920, height: 1080 };
};

const constrainToViewport = (x: number, y: number, width: number, height: number) => {
  const viewport = getViewportSize();
  return {
    x: Math.max(0, Math.min(x, viewport.width - 100)),
    y: Math.max(0, Math.min(y, viewport.height - 100))
  };
};

export const useWindowStore = create<WindowManagerState>()(
  persist(
    (set, get) => ({
      windows: {},
      focusedWindowId: null,
      zIndexCounter: 10,

      openWindow: (appId, title, config = {}) => {
        const id = `${appId}-${Date.now()}`;
        const existingWindows = Object.values(get().windows).filter(w => w.appId === appId);
        const cascadeOffset = existingWindows.length * 30;

        const newWindow: WindowExtendedState = {
          id,
          title,
          appId,
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          position: { x: 100 + cascadeOffset, y: 100 + cascadeOffset },
          size: { 
            width: config.size?.width || DEFAULT_WINDOW_WIDTH, 
            height: config.size?.height || DEFAULT_WINDOW_HEIGHT 
          },
          zIndex: get().zIndexCounter + 1,
          minimizable: config.minimizable !== false,
          maximizable: config.maximizable !== false,
          closeable: config.closeable !== false,
          resizable: config.resizable !== false,
          ...config,
        };

        set((state) => ({
          windows: { ...state.windows, [id]: newWindow },
          focusedWindowId: id,
          zIndexCounter: state.zIndexCounter + 1,
        }));
      },

      closeWindow: (windowId) => {
        set((state) => {
          const newWindows = { ...state.windows };
          delete newWindows[windowId];
          return {
            windows: newWindows,
            focusedWindowId: state.focusedWindowId === windowId ? null : state.focusedWindowId,
          };
        });
      },

      minimizeWindow: (windowId) => {
        const window = get().windows[windowId];
        if (window?.minimizable) {
          set((state) => ({
            windows: {
              ...state.windows,
              [windowId]: { ...state.windows[windowId], isMinimized: true },
            },
          }));
        }
      },

      restoreWindow: (windowId) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [windowId]: { ...state.windows[windowId], isMinimized: false },
          },
        }));
        get().focusWindow(windowId);
      },

      maximizeWindow: (windowId) => {
        const window = get().windows[windowId];
        if (window?.maximizable && !window.isMaximized) {
          const viewport = getViewportSize();
          set((state) => ({
            windows: {
              ...state.windows,
              [windowId]: { 
                ...state.windows[windowId], 
                isMaximized: true,
                isMinimized: false,
                previousState: {
                  position: { ...state.windows[windowId].position },
                  size: { ...state.windows[windowId].size }
                },
                position: { x: 0, y: 0 },
                size: { width: viewport.width, height: viewport.height },
              },
            },
          }));
        }
      },

      restoreFromMaximize: (windowId) => {
        const window = get().windows[windowId];
        if (window?.isMaximized && window.previousState) {
          set((state) => ({
            windows: {
              ...state.windows,
              [windowId]: { 
                ...state.windows[windowId], 
                isMaximized: false,
                position: window.previousState.position,
                size: window.previousState.size,
                previousState: undefined,
              },
            },
          }));
        }
      },

      focusWindow: (windowId) => {
        set((state) => ({
          focusedWindowId: windowId,
          zIndexCounter: state.zIndexCounter + 1,
          windows: {
            ...state.windows,
            [windowId]: { ...state.windows[windowId], zIndex: state.zIndexCounter + 1, isMinimized: false },
          },
        }));
      },

      updateWindowPosition: (windowId, x, y) => {
        const window = get().windows[windowId];
        if (!window?.isMaximized) {
          const constrained = constrainToViewport(x, y, window.size.width, window.size.height);
          set((state) => ({
            windows: {
              ...state.windows,
              [windowId]: { ...state.windows[windowId], position: constrained },
            },
          }));
        }
      },

      updateWindowSize: (windowId, width, height) => {
        const window = get().windows[windowId];
        if (!window?.isMaximized) {
          const constrainedWidth = Math.max(MIN_WINDOW_WIDTH, Math.min(width, getViewportSize().width));
          const constrainedHeight = Math.max(MIN_WINDOW_HEIGHT, Math.min(height, getViewportSize().height));
          set((state) => ({
            windows: {
              ...state.windows,
              [windowId]: { 
                ...state.windows[windowId], 
                size: { width: constrainedWidth, height: constrainedHeight } 
              },
            },
          }));
        }
      },

      bringToFront: (windowId) => {
        get().focusWindow(windowId);
      },

      startDrag: (windowId, offsetX, offsetY) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [windowId]: { 
              ...state.windows[windowId], 
              isDragging: true,
              dragOffset: { x: offsetX, y: offsetY }
            },
          },
        }));
      },

      endDrag: (windowId) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [windowId]: { 
              ...state.windows[windowId], 
              isDragging: false,
              dragOffset: undefined
            },
          },
        }));
      },

      startResize: (windowId, handle, originalSize, originalPosition) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [windowId]: { 
              ...state.windows[windowId], 
              isResizing: true,
              resizeHandle: handle,
              originalSize,
              originalPosition,
            },
          },
        }));
      },

      endResize: (windowId) => {
        set((state) => ({
          windows: {
            ...state.windows,
            [windowId]: { 
              ...state.windows[windowId], 
              isResizing: false,
              resizeHandle: null,
              originalSize: undefined,
              originalPosition: undefined,
            },
          },
        }));
      },

      snapToGrid: (windowId, gridSize = 20) => {
        const window = get().windows[windowId];
        if (!window?.isMaximized) {
          const snappedX = Math.round(window.position.x / gridSize) * gridSize;
          const snappedY = Math.round(window.position.y / gridSize) * gridSize;
          get().updateWindowPosition(windowId, snappedX, snappedY);
        }
      },

      cascadeWindows: () => {
        const windows = Object.values(get().windows).filter(w => !w.isMinimized && !w.isMaximized);
        const cascadeOffset = 30;
        
        windows.forEach((window, index) => {
          const newPosition = { x: 100 + (index * cascadeOffset), y: 100 + (index * cascadeOffset) };
          const constrained = constrainToViewport(newPosition.x, newPosition.y, window.size.width, window.size.height);
          
          set((state) => ({
            windows: {
              ...state.windows,
              [window.id]: { ...state.windows[window.id], position: constrained },
            },
          }));
        });
      },

      tileWindows: () => {
        const windows = Object.values(get().windows)
          .filter(w => !w.isMinimized && !w.isMaximized)
          .sort((a, b) => a.zIndex - b.zIndex);
        
        const viewport = getViewportSize();
        const count = windows.length;
        
        if (count === 0) return;
        
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const windowWidth = Math.floor((viewport.width - 100) / cols);
        const windowHeight = Math.floor((viewport.height - 100) / rows);
        
        windows.forEach((window, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          
          const newPosition = { x: 50 + (col * windowWidth), y: 50 + (row * windowHeight) };
          const newSize = { width: windowWidth - 10, height: windowHeight - 10 };
          
          set((state) => ({
            windows: {
              ...state.windows,
              [window.id]: { ...state.windows[window.id], position: newPosition, size: newSize },
            },
          }));
        });
      },

      saveWindowState: () => {
        // Handled by persist middleware
      },

      loadWindowState: () => {
        // Handled by persist middleware
      },
    }),
    {
      name: 'aether-window-store',
      partialize: (state) => ({
        windows: state.windows,
      }),
    }
  )
);
