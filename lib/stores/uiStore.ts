import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface UIStore {
  sidebarOpen: boolean;
  startMenuOpen: boolean;
  selectedApp: string | null;
  theme: Theme;
  toggleSidebar: () => void;
  toggleStartMenu: () => void;
  selectApp: (appId: string | null) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  startMenuOpen: false,
  selectedApp: null,
  theme: 'dark',

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleStartMenu: () => {
    set((state) => ({ startMenuOpen: !state.startMenuOpen }));
  },

  selectApp: (appId: string | null) => {
    set({ selectedApp: appId });
  },

  setTheme: (theme: Theme) => {
    set({ theme });
  },
}));
