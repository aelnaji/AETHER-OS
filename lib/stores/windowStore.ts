import { create } from 'zustand';
import { WindowState, WindowConfig } from '@/lib/types/window';

interface WindowStore {
  windows: Map<string, WindowState>;
  focusedWindowId: string | null;
  zIndexCounter: number;
  openWindow: (config: WindowConfig) => string;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  bringToFront: (windowId: string) => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: new Map(),
  focusedWindowId: null,
  zIndexCounter: 1000,

  openWindow: (config: WindowConfig) => {
    const windowId = `${config.appId}-${Date.now()}`;
    const { zIndexCounter } = get();

    const newWindow: WindowState = {
      id: windowId,
      title: config.title,
      appId: config.appId,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: config.initialPosition || { x: 100, y: 100 },
      size: config.initialSize || { width: 800, height: 600 },
      zIndex: zIndexCounter,
    };

    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.set(windowId, newWindow);
      return {
        windows: newWindows,
        focusedWindowId: windowId,
        zIndexCounter: state.zIndexCounter + 1,
      };
    });

    return windowId;
  },

  closeWindow: (windowId: string) => {
    set((state) => {
      const newWindows = new Map(state.windows);
      newWindows.delete(windowId);
      
      let newFocusedWindowId = state.focusedWindowId;
      if (state.focusedWindowId === windowId) {
        const remainingWindows = Array.from(newWindows.values())
          .filter(w => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        newFocusedWindowId = remainingWindows.length > 0 ? remainingWindows[0].id : null;
      }

      return {
        windows: newWindows,
        focusedWindowId: newFocusedWindowId,
      };
    });
  },

  minimizeWindow: (windowId: string) => {
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(windowId, { ...window, isMinimized: true });

      let newFocusedWindowId = state.focusedWindowId;
      if (state.focusedWindowId === windowId) {
        const remainingWindows = Array.from(newWindows.values())
          .filter(w => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        newFocusedWindowId = remainingWindows.length > 0 ? remainingWindows[0].id : null;
      }

      return {
        windows: newWindows,
        focusedWindowId: newFocusedWindowId,
      };
    });
  },

  maximizeWindow: (windowId: string) => {
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(windowId, {
        ...window,
        isMaximized: !window.isMaximized,
        isMinimized: false,
      });

      return {
        windows: newWindows,
        focusedWindowId: windowId,
      };
    });
  },

  focusWindow: (windowId: string) => {
    const { bringToFront } = get();
    bringToFront(windowId);
    
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;

      if (window.isMinimized) {
        const newWindows = new Map(state.windows);
        newWindows.set(windowId, { ...window, isMinimized: false });
        return {
          windows: newWindows,
          focusedWindowId: windowId,
        };
      }

      return { focusedWindowId: windowId };
    });
  },

  updateWindowPosition: (windowId: string, x: number, y: number) => {
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(windowId, { ...window, position: { x, y } });

      return { windows: newWindows };
    });
  },

  updateWindowSize: (windowId: string, width: number, height: number) => {
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(windowId, { ...window, size: { width, height } });

      return { windows: newWindows };
    });
  },

  bringToFront: (windowId: string) => {
    set((state) => {
      const window = state.windows.get(windowId);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(windowId, { ...window, zIndex: state.zIndexCounter });

      return {
        windows: newWindows,
        zIndexCounter: state.zIndexCounter + 1,
      };
    });
  },
}));
