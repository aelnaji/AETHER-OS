import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  startMenuOpen: boolean;
  selectedApp: string | null;
  theme: 'dark' | 'light';

  toggleSidebar: () => void;
  toggleStartMenu: () => void;
  selectApp: (appId: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  startMenuOpen: false,
  selectedApp: null,
  theme: 'dark',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),
  selectApp: (appId) => set({ selectedApp: appId }),
  setTheme: (theme) => set({ theme }),
}));
