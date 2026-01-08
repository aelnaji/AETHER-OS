import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  startMenuOpen: boolean;
  selectedApp: string | null;
  theme: 'dark' | 'light';

  toggleSidebar: () => void;
  toggleStartMenu: () => void;
  selectApp: (appId: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      startMenuOpen: false,
      selectedApp: null,
      theme: 'dark',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),
      selectApp: (appId) => set({ selectedApp: appId }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const theme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme });
      },
    }),
    {
      name: 'aether-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
