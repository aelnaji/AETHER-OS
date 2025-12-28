import { create } from 'zustand';
import { WindowState, WindowPosition, WindowSize } from '../types/window';

interface WindowManagerState {
  windows: Record<string, WindowState>;
  focusedWindowId: string | null;
  zIndexCounter: number;

  openWindow: (appId: string, title: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  bringToFront: (windowId: string) => void;
}

export const useWindowStore = create<WindowManagerState>((set, get) => ({
  windows: {},
  focusedWindowId: null,
  zIndexCounter: 10,

  openWindow: (appId, title) => {
    const id = `${appId}-${Date.now()}`;
    const newWindow: WindowState = {
      id,
      title,
      appId,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
      zIndex: get().zIndexCounter + 1,
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
    set((state) => ({
      windows: {
        ...state.windows,
        [windowId]: { ...state.windows[windowId], isMinimized: true },
      },
    }));
  },

  maximizeWindow: (windowId) => {
    set((state) => ({
      windows: {
        ...state.windows,
        [windowId]: { 
          ...state.windows[windowId], 
          isMaximized: !state.windows[windowId].isMaximized,
          isMinimized: false 
        },
      },
    }));
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
    set((state) => ({
      windows: {
        ...state.windows,
        [windowId]: { ...state.windows[windowId], position: { x, y } },
      },
    }));
  },

  updateWindowSize: (windowId, width, height) => {
    set((state) => ({
      windows: {
        ...state.windows,
        [windowId]: { ...state.windows[windowId], size: { width, height } },
      },
    }));
  },

  bringToFront: (windowId) => {
    get().focusWindow(windowId);
  },
}));
