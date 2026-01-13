import { useEffect, useCallback } from 'react';
import { useWindowStore } from '../stores/windowStore';

interface KeyboardShortcutConfig {
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (
  config: KeyboardShortcutConfig = {}
) => {
  const { enabled = true, preventDefault = true } = config;
  
  const windows = useWindowStore((state) => state.windows);
  const focusedWindowId = useWindowStore((state) => state.focusedWindowId);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const restoreFromMaximize = useWindowStore((state) => state.restoreFromMaximize);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const openWindow = useWindowStore((state) => state.openWindow);
  const cascadeWindows = useWindowStore((state) => state.cascadeWindows);
  const tileWindows = useWindowStore((state) => state.tileWindows);

  // Alt+Tab - Cycle through windows
  const handleAltTab = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'Tab') {
        if (preventDefault) e.preventDefault();

        const windowIds = Object.keys(windows).filter(
          (id) => !windows[id].isMinimized
        );

        if (windowIds.length === 0) return;

        const currentIndex = windowIds.indexOf(focusedWindowId || '');
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + windowIds.length) % windowIds.length
          : (currentIndex + 1) % windowIds.length;

        focusWindow(windowIds[nextIndex]);
      }
    },
    [windows, focusedWindowId, focusWindow, preventDefault]
  );

  // Alt+F4 - Close focused window
  const handleAltF4 = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'F4') {
        if (preventDefault) e.preventDefault();

        if (focusedWindowId) {
          closeWindow(focusedWindowId);
        }
      }
    },
    [focusedWindowId, closeWindow, preventDefault]
  );

  // Ctrl+M - Minimize focused window
  const handleCtrlM = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        if (preventDefault) e.preventDefault();

        if (focusedWindowId) {
          minimizeWindow(focusedWindowId);
        }
      }
    },
    [focusedWindowId, minimizeWindow, preventDefault]
  );

  // Ctrl+Space or F11 - Maximize/Restore focused window
  const handleMaximize = useCallback(
    (e: KeyboardEvent) => {
      const isMaximizeShortcut = (e.ctrlKey && e.key === ' ') || e.key === 'F11';
      
      if (isMaximizeShortcut && focusedWindowId) {
        if (preventDefault) e.preventDefault();

        const window = windows[focusedWindowId];
        if (window.isMaximized) {
          restoreFromMaximize(focusedWindowId);
        } else {
          maximizeWindow(focusedWindowId);
        }
      }
    },
    [focusedWindowId, windows, maximizeWindow, restoreFromMaximize, preventDefault]
  );

  // Super/Ctrl+Q - Open A.E Chat
  const handleOpenChat = useCallback(
    (e: KeyboardEvent) => {
      const isOpenChatShortcut = (e.metaKey || e.ctrlKey) && e.key === 'q';
      
      if (isOpenChatShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('aether-chat', 'A.E Chat');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+T - Open Terminal
  const handleOpenTerminal = useCallback(
    (e: KeyboardEvent) => {
      const isOpenTerminalShortcut = (e.metaKey || e.ctrlKey) && e.key === 't';
      
      if (isOpenTerminalShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('terminal', 'Terminal');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+, - Open Settings
  const handleOpenSettings = useCallback(
    (e: KeyboardEvent) => {
      const isOpenSettingsShortcut = (e.metaKey || e.ctrlKey) && e.key === ',';
      
      if (isOpenSettingsShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('settings', 'Settings');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+E - Open File Explorer
  const handleOpenFileExplorer = useCallback(
    (e: KeyboardEvent) => {
      const isOpenFileExplorerShortcut = (e.metaKey || e.ctrlKey) && e.key === 'e';
      
      if (isOpenFileExplorerShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('file-explorer', 'File Explorer');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+P - Open Package Manager
  const handleOpenPackageManager = useCallback(
    (e: KeyboardEvent) => {
      const isOpenPackageManagerShortcut = (e.metaKey || e.ctrlKey) && e.key === 'p';
      
      if (isOpenPackageManagerShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('package-manager', 'Package Manager');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+S - Open System Monitor
  const handleOpenSystemMonitor = useCallback(
    (e: KeyboardEvent) => {
      const isOpenSystemMonitorShortcut = (e.metaKey || e.ctrlKey) && e.key === 's';
      
      if (isOpenSystemMonitorShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('system-monitor', 'System Monitor');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+Shift+P - Open Process Manager
  const handleOpenProcessManager = useCallback(
    (e: KeyboardEvent) => {
      const isOpenProcessManagerShortcut = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P';
      
      if (isOpenProcessManagerShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('process-manager', 'Process Manager');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+Shift+A - Open App Store
  const handleOpenAppStore = useCallback(
    (e: KeyboardEvent) => {
      const isOpenAppStoreShortcut = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A';
      
      if (isOpenAppStoreShortcut) {
        if (preventDefault) e.preventDefault();
        openWindow('app-store', 'App Store');
      }
    },
    [openWindow, preventDefault]
  );

  // Super/Ctrl+Left/Right - Snap window to left/right half
  const handleSnapWindow = useCallback(
    (e: KeyboardEvent) => {
      if (focusedWindowId && typeof globalThis.window !== 'undefined') {
        const viewport = { width: globalThis.window.innerWidth, height: globalThis.window.innerHeight };
        const isLeft = (e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft';
        const isRight = (e.metaKey || e.ctrlKey) && e.key === 'ArrowRight';

        if (isLeft || isRight) {
          if (preventDefault) e.preventDefault();

          const currentWindow = windows[focusedWindowId];
          if (currentWindow.isMaximized) {
            restoreFromMaximize(focusedWindowId);
          }

          if (isLeft) {
            useWindowStore.getState().updateWindowPosition(focusedWindowId, 0, 0);
            useWindowStore.getState().updateWindowSize(
              focusedWindowId,
              viewport.width / 2,
              viewport.height
            );
          } else {
            useWindowStore.getState().updateWindowPosition(
              focusedWindowId,
              viewport.width / 2,
              0
            );
            useWindowStore.getState().updateWindowSize(
              focusedWindowId,
              viewport.width / 2,
              viewport.height
            );
          }
        }
      }
    },
    [focusedWindowId, windows, restoreFromMaximize, preventDefault]
  );

  // Super/Ctrl+A - Cascade windows
  const handleCascadeWindows = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        if (preventDefault) e.preventDefault();
        cascadeWindows();
      }
    },
    [cascadeWindows, preventDefault]
  );

  // Super/Ctrl+D - Tile windows
  const handleTileWindows = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        if (preventDefault) e.preventDefault();
        tileWindows();
      }
    },
    [tileWindows, preventDefault]
  );

  // Escape - Deselect/focus nothing
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (preventDefault) e.preventDefault();
        // Optionally blur focused element or close modals
        (document.activeElement as HTMLElement)?.blur();
      }
    },
    [preventDefault]
  );

  useEffect(() => {
    if (!enabled || typeof globalThis.window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const isInput = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput) {
        // Only allow certain shortcuts in input fields
        if (e.key === 'Escape') {
          handleEscape(e);
        }
        return;
      }

      handleAltTab(e);
      handleAltF4(e);
      handleCtrlM(e);
      handleMaximize(e);
      handleOpenChat(e);
      handleOpenTerminal(e);
      handleOpenSettings(e);
      handleOpenFileExplorer(e);
      handleOpenPackageManager(e);
      handleOpenSystemMonitor(e);
      handleOpenProcessManager(e);
      handleOpenAppStore(e);
      handleSnapWindow(e);
      handleCascadeWindows(e);
      handleTileWindows(e);
      handleEscape(e);
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [
    enabled,
    handleAltTab,
    handleAltF4,
    handleCtrlM,
    handleMaximize,
    handleOpenChat,
    handleOpenTerminal,
    handleOpenSettings,
    handleOpenFileExplorer,
    handleOpenPackageManager,
    handleOpenSystemMonitor,
    handleOpenProcessManager,
    handleOpenAppStore,
    handleSnapWindow,
    handleCascadeWindows,
    handleTileWindows,
    handleEscape,
  ]);

  return {
    shortcuts: {
      altTab: 'Cycle through windows',
      altF4: 'Close focused window',
      ctrlM: 'Minimize focused window',
      f11: 'Maximize/Restore window',
      ctrlSpace: 'Maximize/Restore window',
      metaQ: 'Open A.E Chat',
      metaT: 'Open Terminal',
      metaComma: 'Open Settings',
      metaE: 'Open File Explorer',
      metaP: 'Open Package Manager',
      metaS: 'Open System Monitor',
      metaShiftP: 'Open Process Manager',
      metaShiftA: 'Open App Store',
      metaLeft: 'Snap window left',
      metaRight: 'Snap window right',
      metaA: 'Cascade windows',
      metaD: 'Tile windows',
      escape: 'Deselect',
    },
  };
};
