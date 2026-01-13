'use client';

import React from 'react';
import { useWindowStore } from '@/lib/stores/windowStore';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { AdvancedWindow } from './windows/AdvancedWindow';
import {
  AetherChat
} from './windows/AetherChat';
import { SettingsPanel } from './windows/Settings';
import { TerminalEnhanced } from './windows/Terminal';
import { FileExplorer, PackageManager, SystemMonitor, ProcessManager } from './windows';
import { AppStore } from './windows/AppStore';

const WINDOW_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'aether-chat': AetherChat,
  settings: SettingsPanel,
  terminal: TerminalEnhanced,
  'file-explorer': FileExplorer,
  'package-manager': PackageManager,
  'system-monitor': SystemMonitor,
  'process-manager': ProcessManager,
  'app-store': AppStore,
};

export function WindowManager() {
  const windows = useWindowStore((state) => state.windows);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const openWindow = useWindowStore((state) => state.openWindow);
  const { connected } = useBytebot();
  const { isConfigured } = useSettingsStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ enabled: true });

  const handleOpenSettings = () => {
    openWindow('settings', 'Settings');
  };

  const renderWindow = (windowId: string, window: any) => {
    const Component = WINDOW_COMPONENTS[window.appId];

    if (!Component) {
      return (
        <AdvancedWindow
          key={windowId}
          windowId={windowId}
          minimizable={window.minimizable}
          maximizable={window.maximizable}
          closeable={window.closeable}
          resizable={window.resizable}
        >
          <div className="p-6">
            <h3 className="text-white font-medium mb-4">{window.title}</h3>
            <p className="text-gray-400">Unknown window type: {window.appId}</p>
          </div>
        </AdvancedWindow>
      );
    }

    return (
      <AdvancedWindow
        key={windowId}
        windowId={windowId}
        minimizable={window.minimizable}
        maximizable={window.maximizable}
        closeable={window.closeable}
        resizable={window.resizable}
      >
        <Component windowId={windowId} onClose={() => closeWindow(windowId)} />
      </AdvancedWindow>
    );
  };

  // Show configuration notice if settings not configured
  if (!isConfigured && Object.keys(windows).length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="bg-[#171717] border border-amber-500/30 rounded-xl p-8 max-w-md mx-4">
          <h2 className="text-xl font-bold text-white mb-4">⚙️ A.E Configuration Required</h2>
          <p className="text-gray-300 mb-4">
            To get started with A.E (AETHER ENGINE), you need to configure your NVIDIA API key.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            A.E will use this to access powerful language models for autonomous operation of your system.
          </p>
          <button
            onClick={handleOpenSettings}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Configure A.E Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {Object.entries(windows).map(([windowId, window]) => renderWindow(windowId, window))}
      
      {/* System Status Bar */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#171717]/80 backdrop-blur-sm rounded-lg border border-white/10">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-300">
            {connected ? 'Bytebot Connected' : 'Bytebot Disconnected'}
          </span>
        </div>

        {/* Settings Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#171717]/80 backdrop-blur-sm rounded-lg border border-white/10">
          <span className="text-xs text-gray-300">
            {isConfigured ? 'A.E Ready' : 'A.E Not Configured'}
          </span>
        </div>
      </div>
    </>
  );
}