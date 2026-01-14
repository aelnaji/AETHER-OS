'use client';

import React from 'react';
import { useWindowStore } from '@/lib/stores/windowStore';
import { useFileSystemStore } from '@/lib/stores/fileSystemStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { WindowManager } from './WindowManager';
import { Taskbar } from './Taskbar';
import { Settings, Terminal, MessageSquare, Folder, Package, Activity, List, Store, Sparkles } from 'lucide-react';

export function Desktop() {
  const { windows, openWindow } = useWindowStore();
  const { getInstalledApps } = useFileSystemStore();
  const { theme } = useUIStore();
  const { connected } = useBytebot();

  // Enable keyboard shortcuts at the desktop level
  useKeyboardShortcuts({ enabled: true });

  // Get installed apps with proper null checks and type safety
  const installedApps = React.useMemo(() => {
    const apps = getInstalledApps();
    return Array.isArray(apps) ? apps : [];
  }, [getInstalledApps]);

  const handleAppClick = (appId: string, title: string) => {
    openWindow(appId, title);
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Context menu functionality can be added here
    console.log('Desktop context menu');
  };

  return (
    <div className="relative w-full h-screen bg-warmwind-bg-black overflow-hidden" onContextMenu={handleDesktopContextMenu}>
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-warmwind-primary-amber/10 blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-warmwind-primary-rose/10 blur-[120px] animate-pulse-glow pointer-events-none" />

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="flex flex-col gap-4">
          {/* Quick Launch Icons */}
          <div
            onClick={() => handleAppClick('aether-chat', 'A.E Chat')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} className="text-amber-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">A.E Chat</span>
          </div>

          <div
            onClick={() => handleAppClick('quicky-ai', 'Quicky AI')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Sparkles size={24} className="text-purple-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Quicky AI</span>
          </div>

          <div
            onClick={() => handleAppClick('terminal', 'Terminal')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Terminal size={24} className="text-amber-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Terminal</span>
          </div>

          <div
            onClick={() => handleAppClick('file-explorer', 'Files')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Folder size={24} className="text-amber-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Files</span>
          </div>

          <div
            onClick={() => handleAppClick('settings', 'Settings')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Settings size={24} className="text-amber-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Settings</span>
          </div>

          <div
            onClick={() => handleAppClick('package-manager', 'Packages')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Package size={24} className="text-purple-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Packages</span>
          </div>

          <div
            onClick={() => handleAppClick('system-monitor', 'Monitor')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Activity size={24} className="text-blue-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Monitor</span>
          </div>

          <div
            onClick={() => handleAppClick('process-manager', 'Processes')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <List size={24} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">Processes</span>
          </div>

          <div
            onClick={() => handleAppClick('app-store', 'App Store')}
            className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Store size={24} className="text-amber-400" />
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white">App Store</span>
          </div>

          {/* Installed Apps */}
          {installedApps && installedApps.length > 0 && installedApps.map((app) => (
            <div 
              key={app.id}
              onClick={() => handleAppClick(app.id, app.name)}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-smooth group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="text-lg">{app.icon}</span>
              </div>
              <span className="text-xs text-gray-300 group-hover:text-white">{app.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome Message (when no windows open) */}
      {Object.keys(windows).length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-5">
          <h1 className="text-6xl font-bold mb-4 tracking-tighter text-white">
            AETHER<span className="text-warmwind-primary-amber">OS</span>
          </h1>
          <p className="text-gray-400 mb-8 font-light">AI-Powered Operating System</p>
          <div className="flex gap-4">
            <button
              onClick={() => handleAppClick('aether-chat', 'A.E Chat')}
              className="px-6 py-3 glass rounded-xl hover:bg-white/5 transition-smooth text-sm border border-white/10"
            >
              Start A.E Chat
            </button>
            <button
              onClick={() => handleAppClick('terminal', 'Terminal')}
              className="px-6 py-3 glass rounded-xl hover:bg-white/5 transition-smooth text-sm border border-white/10"
            >
              Open Terminal
            </button>
            <button
              onClick={() => handleAppClick('settings', 'Settings')}
              className="px-6 py-3 glass rounded-xl hover:bg-white/5 transition-smooth text-sm border border-white/10"
            >
              Configure A.E
            </button>
          </div>
          
          {/* Connection Status */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>
                {connected ? 'Connected to Bytebot Backend' : 'Bytebot Backend Disconnected'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Window Manager */}
      <WindowManager />

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}