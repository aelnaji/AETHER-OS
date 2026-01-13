'use client';

import React, { useState, useMemo } from 'react';
import { Store, Search, Download, Trash2, CheckCircle, Star, Package, Filter } from 'lucide-react';
import { useFileSystemStore } from '@/lib/stores/fileSystemStore';

interface AppStoreProps {
  windowId?: string;
  onClose?: () => void;
}

interface AvailableApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  rating: number;
  downloads: number;
  version: string;
  size: string;
  publisher: string;
}

type CategoryFilter = 'all' | 'productivity' | 'development' | 'media' | 'system' | 'games';

// Available apps catalog
const AVAILABLE_APPS: AvailableApp[] = [
  {
    id: 'code-editor',
    name: 'Code Editor Pro',
    icon: '💻',
    description: 'Advanced code editor with syntax highlighting and IntelliSense',
    category: 'development',
    rating: 4.8,
    downloads: 125000,
    version: '2.5.0',
    size: '85 MB',
    publisher: 'AETHER Labs',
  },
  {
    id: 'music-player',
    name: 'Music Player',
    icon: '🎵',
    description: 'Beautiful music player with playlist support and equalizer',
    category: 'media',
    rating: 4.6,
    downloads: 98000,
    version: '3.2.1',
    size: '45 MB',
    publisher: 'AETHER Media',
  },
  {
    id: 'notes-app',
    name: 'Notes++',
    icon: '📝',
    description: 'Simple and elegant note-taking app with markdown support',
    category: 'productivity',
    rating: 4.7,
    downloads: 156000,
    version: '1.8.4',
    size: '12 MB',
    publisher: 'AETHER Office',
  },
  {
    id: 'image-viewer',
    name: 'Image Gallery',
    icon: '🖼️',
    description: 'Fast image viewer with editing and organizing capabilities',
    category: 'media',
    rating: 4.5,
    downloads: 89000,
    version: '2.1.0',
    size: '38 MB',
    publisher: 'AETHER Media',
  },
  {
    id: 'task-manager',
    name: 'Task Master',
    icon: '✅',
    description: 'Powerful task and project management tool',
    category: 'productivity',
    rating: 4.9,
    downloads: 178000,
    version: '4.0.2',
    size: '28 MB',
    publisher: 'AETHER Office',
  },
  {
    id: 'video-player',
    name: 'Video Player HD',
    icon: '🎬',
    description: 'Feature-rich video player supporting all major formats',
    category: 'media',
    rating: 4.7,
    downloads: 245000,
    version: '5.3.1',
    size: '92 MB',
    publisher: 'AETHER Media',
  },
  {
    id: 'calculator',
    name: 'Scientific Calculator',
    icon: '🔢',
    description: 'Advanced calculator with scientific and programming modes',
    category: 'productivity',
    rating: 4.4,
    downloads: 67000,
    version: '1.5.2',
    size: '8 MB',
    publisher: 'AETHER Tools',
  },
  {
    id: 'git-client',
    name: 'Git Manager',
    icon: '🌿',
    description: 'Visual Git client with branch management and merge tools',
    category: 'development',
    rating: 4.8,
    downloads: 134000,
    version: '3.7.0',
    size: '65 MB',
    publisher: 'AETHER Labs',
  },
  {
    id: 'browser',
    name: 'AETHER Browser',
    icon: '🌐',
    description: 'Fast and secure web browser with privacy features',
    category: 'productivity',
    rating: 4.6,
    downloads: 312000,
    version: '6.2.4',
    size: '128 MB',
    publisher: 'AETHER Network',
  },
  {
    id: 'game-tetris',
    name: 'Tetris Classic',
    icon: '🎮',
    description: 'Classic block-stacking puzzle game',
    category: 'games',
    rating: 4.3,
    downloads: 89000,
    version: '1.2.0',
    size: '15 MB',
    publisher: 'AETHER Games',
  },
  {
    id: 'backup-tool',
    name: 'Backup Manager',
    icon: '💾',
    description: 'Automated backup and recovery tool',
    category: 'system',
    rating: 4.7,
    downloads: 156000,
    version: '2.4.1',
    size: '42 MB',
    publisher: 'AETHER System',
  },
  {
    id: 'markdown-editor',
    name: 'MD Editor',
    icon: '📄',
    description: 'Live markdown editor with preview and export',
    category: 'development',
    rating: 4.6,
    downloads: 78000,
    version: '1.9.3',
    size: '22 MB',
    publisher: 'AETHER Labs',
  },
];

export function AppStore({ windowId, onClose }: AppStoreProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedApp, setSelectedApp] = useState<AvailableApp | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);

  const { installedApps, installApp, uninstallApp } = useFileSystemStore();

  // Filter apps
  const filteredApps = useMemo(() => {
    let apps = AVAILABLE_APPS;

    // Apply category filter
    if (categoryFilter !== 'all') {
      apps = apps.filter(app => app.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      apps = apps.filter(
        app =>
          app.name.toLowerCase().includes(query) ||
          app.description.toLowerCase().includes(query) ||
          app.publisher.toLowerCase().includes(query) ||
          app.category.toLowerCase().includes(query)
      );
    }

    return apps;
  }, [searchQuery, categoryFilter]);

  const isInstalled = (appId: string) => {
    return installedApps.hasOwnProperty(appId);
  };

  const handleInstall = async (app: AvailableApp) => {
    setInstalling(app.id);
    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    installApp(app.id, app.name, app.icon);
    setInstalling(null);
  };

  const handleUninstall = (appId: string) => {
    if (confirm('Are you sure you want to uninstall this app?')) {
      uninstallApp(appId);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const categories: CategoryFilter[] = ['all', 'productivity', 'development', 'media', 'system', 'games'];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121212]">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-white">App Store</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Package size={14} />
          <span>{Object.keys(installedApps).length} apps installed</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#0f0f0f] space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="flex-1 bg-transparent text-gray-300 text-sm focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="text-gray-400 shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                categoryFilter === category
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-300'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* App List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredApps.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>No apps found</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApps.map((app) => {
                const installed = isInstalled(app.id);
                const isInstalling = installing === app.id;

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`bg-[#121212] border border-white/10 rounded-lg p-4 cursor-pointer transition-all hover:border-amber-500/30 hover:bg-[#151515] ${
                      selectedApp?.id === app.id ? 'border-amber-500 bg-[#151515]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-2xl shrink-0">
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-white font-semibold text-sm truncate">{app.name}</h3>
                          {installed && (
                            <CheckCircle size={16} className="text-green-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-amber-400" />
                            <span>{app.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{app.downloads.toLocaleString()} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-[#0a0a0a] rounded">
                          {getCategoryLabel(app.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {installed ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUninstall(app.id);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 size={12} className="inline mr-1" />
                            Uninstall
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstall(app);
                            }}
                            disabled={isInstalling}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                          >
                            {isInstalling ? (
                              <>Installing...</>
                            ) : (
                              <>
                                <Download size={12} className="inline mr-1" />
                                Install
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Details Panel */}
        {selectedApp && (
          <div className="w-80 border-l border-white/10 bg-[#0f0f0f] p-4 overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-4xl mx-auto mb-3">
                {selectedApp.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{selectedApp.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{selectedApp.publisher}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-gray-400 mb-1">Description</div>
                <div className="text-gray-300">{selectedApp.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-400 mb-1">Version</div>
                  <div className="text-white">{selectedApp.version}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Size</div>
                  <div className="text-white">{selectedApp.size}</div>
                </div>
              </div>

              <div>
                <div className="text-gray-400 mb-1">Category</div>
                <div className="text-white">{getCategoryLabel(selectedApp.category)}</div>
              </div>

              <div>
                <div className="text-gray-400 mb-1">Rating</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={16} fill="currentColor" />
                    <span className="text-white font-semibold">{selectedApp.rating}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    ({selectedApp.downloads.toLocaleString()} downloads)
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                {isInstalled(selectedApp.id) ? (
                  <button
                    onClick={() => handleUninstall(selectedApp.id)}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(selectedApp)}
                    disabled={installing === selectedApp.id}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 transition-colors flex items-center justify-center gap-2"
                  >
                    {installing === selectedApp.id ? (
                      <>Installing...</>
                    ) : (
                      <>
                        <Download size={16} />
                        Install
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
