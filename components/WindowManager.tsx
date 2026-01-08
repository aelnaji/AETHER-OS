'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useWindowStore } from '@/lib/stores/windowStore';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { AdvancedWindow } from './windows/AdvancedWindow';

const AetherChat = dynamic(() => import('./windows/AetherChat').then((m) => m.AetherChat), { ssr: false });
const Settings = dynamic(() => import('./windows/Settings').then((m) => m.Settings), { ssr: false });
const TerminalEnhanced = dynamic(() => import('./windows/Terminal').then((m) => m.TerminalEnhanced), { ssr: false });
const FileExplorer = dynamic(() => import('./windows/FileExplorer').then((m) => m.FileExplorer), { ssr: false });
const PackageManager = dynamic(() => import('./windows/PackageManager').then((m) => m.PackageManager), { ssr: false });
const SystemMonitor = dynamic(() => import('./windows/SystemMonitor').then((m) => m.SystemMonitor), { ssr: false });
const ProcessManager = dynamic(() => import('./windows/ProcessManager').then((m) => m.ProcessManager), { ssr: false });

const WINDOW_COMPONENTS = {
  'aether-chat': AetherChat,
  settings: Settings,
  terminal: TerminalEnhanced,
  'file-explorer': FileExplorer,
  'package-manager': PackageManager,
  'system-monitor': SystemMonitor,
  'process-manager': ProcessManager,
} as const;

export function WindowManager() {
  const { windows, openWindow } = useWindowStore();
  const { connected } = useBytebot();
  const { isConfigured } = useSettingsStore();

  useKeyboardShortcuts({ enabled: true });

  const handleOpenSettings = () => {
    openWindow('settings', 'Settings');
  };

  const renderWindow = (windowId: string, window: any) => {
    const Component = WINDOW_COMPONENTS[window.appId as keyof typeof WINDOW_COMPONENTS];

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
        <Component />
      </AdvancedWindow>
    );
  };

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

      <div className="absolute top-4 right-4 z-40 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#171717]/80 backdrop-blur-sm rounded-lg border border-white/10">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-300">{connected ? 'Bytebot Connected' : 'Bytebot Disconnected'}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-[#171717]/80 backdrop-blur-sm rounded-lg border border-white/10">
          <span className="text-xs text-gray-300">{isConfigured ? 'A.E Ready' : 'A.E Not Configured'}</span>
        </div>
      </div>
    </>
  );
}
