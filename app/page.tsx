"use client";

import { useWindowStore, useFileSystemStore, useUIStore } from "@/lib/stores";
import { useEffect } from "react";

export default function Home() {
  const { openWindow } = useWindowStore();
  const { installApp, getInstalledApps } = useFileSystemStore();
  const { theme } = useUIStore();

  useEffect(() => {
    installApp("welcome", "Welcome", "🎉");
    console.log("Zustand stores initialized successfully!");
    console.log("Installed apps:", getInstalledApps());
  }, [installApp, getInstalledApps]);

  const handleOpenWindow = () => {
    const windowId = openWindow({
      title: "Test Window",
      appId: "test-app",
      initialPosition: { x: 150, y: 150 },
      initialSize: { width: 800, height: 600 },
    });
    console.log("Opened window:", windowId);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <div className="glow-amber w-96 h-96 -top-48 -left-48" />
      <div className="glow-rose w-96 h-96 -bottom-48 -right-48" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-6xl font-bold text-white mb-4">
            Project <span className="text-warmwind-amber-500">Aether</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            AI-Powered Operating System Experience
          </p>
          <p className="text-sm text-gray-500">
            Phase 1: Foundation & Warmwind Design System Complete
          </p>
        </div>

        <div className="flex gap-4 animate-slide-up">
          <button
            onClick={handleOpenWindow}
            className="btn-primary"
          >
            Test Window Store
          </button>
          <button className="btn-secondary">
            View Documentation
          </button>
        </div>

        <div className="card max-w-2xl animate-slide-up">
          <h3 className="text-lg font-semibold mb-3 text-warmwind-amber-500">
            ✨ Phase 1 Complete
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✓ Next.js 14 with App Router & TypeScript</li>
            <li>✓ Tailwind CSS with Warmwind Design System</li>
            <li>✓ Zustand State Management (Window, FileSystem, UI stores)</li>
            <li>✓ Glassmorphism & Animation Framework</li>
            <li>✓ Type Definitions & Project Structure</li>
            <li>✓ Ready for Phase 2: Chat UI & AI Integration</li>
          </ul>
        </div>

        <div className="text-xs text-gray-600 space-x-4">
          <span>Theme: {theme}</span>
          <span>•</span>
          <span>Next.js 14</span>
          <span>•</span>
          <span>TypeScript</span>
          <span>•</span>
          <span>Zustand</span>
          <span>•</span>
          <span>Framer Motion</span>
        </div>
      </div>
    </main>
  );
}
