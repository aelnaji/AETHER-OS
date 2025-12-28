'use client';

import React from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useWindowStore } from '@/lib/stores/windowStore';

export default function Home() {
  const { theme } = useUIStore();
  const { openWindow } = useWindowStore();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-warmwind-bg-black">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-warmwind-primary-amber/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-warmwind-primary-rose/10 blur-[120px] animate-pulse-glow" />

      {/* Placeholder Desktop */}
      <div className="relative z-10 flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4 tracking-tighter text-white">
          AETHER<span className="text-warmwind-primary-amber">OS</span>
        </h1>
        <p className="text-gray-400 mb-8 font-light">Warmwind Design System Initialized</p>
        
        <div className="flex gap-4">
          <button 
            onClick={() => openWindow('terminal', 'Terminal')}
            className="px-6 py-2 glass rounded-xl hover:bg-white/5 transition-smooth text-sm"
          >
            Open Terminal
          </button>
          <button 
            className="px-6 py-2 glass rounded-xl hover:bg-white/5 transition-smooth text-sm"
          >
            Settings ({theme})
          </button>
        </div>
      </div>
      
      {/* Taskbar Placeholder */}
      <div className="absolute bottom-0 left-0 right-0 h-16 glass border-t border-white/5 flex items-center justify-center">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-smooth">
              <div className="w-5 h-5 rounded-sm bg-gray-500/20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
