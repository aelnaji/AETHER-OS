'use client';

import React from 'react';
import { useWindowStore } from '@/lib/stores/windowStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { 
  MessageSquare, 
  Terminal, 
  Settings, 
  Minimize2, 
  Square, 
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export function Taskbar() {
  const { windows, focusedWindowId, focusWindow, minimizeWindow, maximizeWindow, closeWindow, openWindow } = useWindowStore();
  const { theme } = useUIStore();
  const { connected } = useBytebot();
  const { isConfigured } = useSettingsStore();

  const handleWindowClick = (windowId: string) => {
    const window = windows[windowId];
    if (window.isMinimized) {
      focusWindow(windowId);
    } else if (focusedWindowId === windowId) {
      minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  const getWindowIcon = (appId: string) => {
    switch (appId) {
      case 'aether-chat': return <MessageSquare size={16} className="text-amber-400" />;
      case 'terminal': return <Terminal size={16} className="text-amber-400" />;
      case 'settings': return <Settings size={16} className="text-amber-400" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded" />;
    }
  };

  const quickLaunchApps = [
    { id: 'aether-chat', icon: MessageSquare, label: 'A.E Chat' },
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 glass border-t border-white/5 flex items-center px-4">
      {/* Quick Launch */}
      <div className="flex items-center gap-2 mr-6">
        {quickLaunchApps.map((app) => (
          <button
            key={app.id}
            onClick={() => openWindow(app.id, app.label)}
            className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-smooth group"
            title={app.label}
          >
            <app.icon size={18} className="text-gray-400 group-hover:text-amber-400" />
          </button>
        ))}
      </div>

      {/* Window Tabs */}
      <div className="flex items-center gap-1 flex-1">
        {Object.entries(windows).map(([windowId, window]) => (
          <div
            key={windowId}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-smooth ${
              focusedWindowId === windowId
                ? 'bg-amber-500/20 border border-amber-500/30'
                : window.isMinimized
                ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                : 'bg-white/10 border border-white/20'
            }`}
            onClick={() => handleWindowClick(windowId)}
          >
            {getWindowIcon(window.appId)}
            <span className="text-sm text-gray-300 group-hover:text-white max-w-32 truncate">
              {window.title}
            </span>
            
            {/* Window Controls */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(windowId);
                }}
                className="p-1 rounded hover:bg-white/20 text-gray-400 hover:text-white"
                title="Minimize"
              >
                <Minimize2 size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  maximizeWindow(windowId);
                }}
                className="p-1 rounded hover:bg-white/20 text-gray-400 hover:text-white"
                title="Maximize"
              >
                <Square size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(windowId);
                }}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="flex items-center gap-4 ml-4">
        {/* Bytebot Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-400">
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* A.E Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-amber-400'}`} />
          <span className="text-xs text-gray-400">
            {isConfigured ? 'A.E Ready' : 'Setup Required'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => {
            // Theme toggle functionality can be added here
            console.log('Theme toggle clicked');
          }}
          className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-smooth"
          title="Toggle Theme"
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-rose-400" />
        </button>
      </div>
    </div>
  );
}