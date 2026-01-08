'use client';

import React from 'react';
import { useWindowStore } from '@/lib/stores/windowStore';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { 
  AetherChat 
} from './windows/AetherChat';
import { SettingsPanel } from './windows/Settings';
import { Terminal } from './windows/Terminal';

const WINDOW_COMPONENTS = {
  'aether-chat': AetherChat,
  'settings': SettingsPanel,
  'terminal': Terminal,
} as const;

export function WindowManager() {
  const { windows, closeWindow, minimizeWindow, maximizeWindow, focusWindow, openWindow } = useWindowStore();
  const { connected } = useBytebot();
  const { isConfigured } = useSettingsStore();

  const handleOpenSettings = () => {
    openWindow('settings', 'Settings');
  };

  const renderWindow = (windowId: string, window: any) => {
    const Component = WINDOW_COMPONENTS[window.appId as keyof typeof WINDOW_COMPONENTS];
    
    if (!Component) {
      return (
        <div
          key={windowId}
          className="absolute bg-[#171717] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          style={{
            left: window.position.x,
            top: window.position.y,
            width: window.size.width,
            height: window.size.height,
            zIndex: window.zIndex,
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-medium">{window.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Unknown Window</span>
              <button
                onClick={() => closeWindow(windowId)}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-gray-400">Unknown window type: {window.appId}</p>
          </div>
        </div>
      );
    }

    const handleClose = () => closeWindow(windowId);
    const handleMinimize = () => minimizeWindow(windowId);
    const handleMaximize = () => maximizeWindow(windowId);
    const handleFocus = () => focusWindow(windowId);

    return (
      <div
        key={windowId}
        className={`absolute bg-[#171717] border border-white/10 rounded-xl shadow-2xl overflow-hidden ${window.isMinimized ? 'hidden' : ''}`}
        style={{
          left: window.position.x,
          top: window.position.y,
          width: window.size.width,
          height: window.size.height,
          zIndex: window.zIndex,
        }}
        onClick={handleFocus}
      >
        <Component onClose={handleClose} />
      </div>
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