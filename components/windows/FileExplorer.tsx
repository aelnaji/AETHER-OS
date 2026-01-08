'use client';

import React, { useState } from 'react';
import {
  File,
  Folder,
  FolderOpen,
  HardDrive,
  Search,
  ChevronRight,
  Grid3X3,
  List,
  MoreHorizontal,
  Trash2,
  Copy,
  Download,
  Edit3,
} from 'lucide-react';

export function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['/home', '/home/user', '/home/user/Documents', '/home/user/Downloads'])
  );

  // Mock file system data
  const fileSystem = {
    '/': {
      type: 'folder',
      children: ['home', 'bin', 'etc', 'usr', 'var'],
    },
    '/home': {
      type: 'folder',
      children: ['user'],
    },
    '/home/user': {
      type: 'folder',
      children: ['Documents', 'Downloads', 'Pictures', 'Projects', '.config'],
    },
    '/home/user/Documents': {
      type: 'folder',
      children: ['notes.txt', 'project-plan.md', 'resume.pdf'],
    },
    '/home/user/Downloads': {
      type: 'folder',
      children: ['setup.exe', 'data.csv', 'image.png'],
    },
    '/home/user/Pictures': {
      type: 'folder',
      children: ['screenshot1.png', 'photo.jpg'],
    },
    '/home/user/Projects': {
      type: 'folder',
      children: ['aether-os', 'web-app', 'mobile-app'],
    },
    '/home/user/.config': {
      type: 'folder',
      children: ['settings.json'],
    },
    '/bin': {
      type: 'folder',
      children: [],
    },
    '/etc': {
      type: 'folder',
      children: [],
    },
    '/usr': {
      type: 'folder',
      children: [],
    },
    '/var': {
      type: 'folder',
      children: [],
    },
  };

  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') return <File className="text-red-400" size={20} />;
    if (ext === 'txt' || ext === 'md') return <File className="text-gray-400" size={20} />;
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <File className="text-purple-400" size={20} />;
    if (ext === 'csv' || ext === 'xlsx') return <File className="text-green-400" size={20} />;
    if (ext === 'exe' || ext === 'sh') return <File className="text-amber-400" size={20} />;
    
    return <File className="text-blue-400" size={20} />;
  };

  const isFolder = (path: string) => {
    return fileSystem[path as keyof typeof fileSystem]?.type === 'folder';
  };

  const getFolderContents = (path: string) => {
    const folder = fileSystem[path as keyof typeof fileSystem];
    if (!folder || folder.type !== 'folder') return [];
    
    return folder.children.map((child) => {
      const childPath = `${path === '/' ? '' : path}/${child}`;
      return {
        name: child,
        path: childPath,
        type: isFolder(childPath) ? 'folder' : 'file',
      };
    });
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: { name: string; path: string; type: string }) => {
    if (item.type === 'folder') {
      setCurrentPath(item.path);
      setExpandedFolders((prev) => new Set([...prev, item.path]));
    } else {
      setSelectedItems([item.path]);
    }
  };

  const handleBackClick = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 1) {
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
    } else {
      setCurrentPath('/');
    }
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Root', path: '/' }];
    
    parts.forEach((part, index) => {
      const path = '/' + parts.slice(0, index + 1).join('/');
      breadcrumbs.push({ label: part, path });
    });
    
    return breadcrumbs;
  };

  const currentContents = getFolderContents(currentPath).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#171717]">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 flex flex-col">
        {/* Drives Section */}
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <HardDrive size={18} className="text-gray-400" />
            <span className="text-sm text-gray-300">Local Disk (C:)</span>
          </div>
        </div>

        {/* Folder Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">
            {/* Render folder tree (simplified) */}
            {['/home', '/home/user'].map((path) => {
              const isExpanded = expandedFolders.has(path);
              const parts = path.split('/').filter(Boolean);
              const label = parts[parts.length - 1];
              const level = parts.length;

              return (
                <div key={path} style={{ paddingLeft: `${level * 12}px` }}>
                  <div
                    className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer text-sm"
                    onClick={() => toggleFolder(path)}
                  >
                    {isExpanded ? (
                      <ChevronRight size={14} className="text-gray-500 rotate-90" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-500" />
                    )}
                    {isExpanded ? (
                      <FolderOpen size={16} className="text-amber-400" />
                    ) : (
                      <Folder size={16} className="text-amber-400" />
                    )}
                    <span className="text-gray-300">{label || 'Root'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-white/10 flex items-center px-4 gap-3">
          {/* Back Button */}
          <button
            onClick={handleBackClick}
            disabled={currentPath === '/'}
            className="p-2 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} className="text-gray-400 rotate-180" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm overflow-hidden">
            {getBreadcrumbs().map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <button
                  onClick={() => setCurrentPath(crumb.path)}
                  className={`hover:text-amber-400 transition-colors ${
                    index === getBreadcrumbs().length - 1
                      ? 'text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {crumb.label}
                </button>
                {index < getBreadcrumbs().length - 1 && (
                  <ChevronRight size={14} className="text-gray-500" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-48 bg-[#0f0f0f] border border-white/20 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded hover:bg-white/10 transition-colors"
          >
            {viewMode === 'grid' ? (
              <List size={18} className="text-gray-400" />
            ) : (
              <Grid3X3 size={18} className="text-gray-400" />
            )}
          </button>

          {/* More Options */}
          <button className="p-2 rounded hover:bg-white/10 transition-colors">
            <MoreHorizontal size={18} className="text-gray-400" />
          </button>
        </div>

        {/* File List/Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Folder size={48} className="mb-3 opacity-50" />
              <p>This folder is empty</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentContents.map((item) => (
                <div
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`group flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all ${
                    selectedItems.includes(item.path)
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.type === 'folder' ? (
                    <Folder size={48} className="text-amber-400 mb-2" />
                  ) : (
                    <div className="mb-2">{getFileIcon(item.path)}</div>
                  )}
                  <span className="text-xs text-gray-300 text-center break-all w-full">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {currentContents.map((item) => (
                <div
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedItems.includes(item.path)
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.type === 'folder' ? (
                    <Folder size={20} className="text-amber-400" />
                  ) : (
                    getFileIcon(item.path)
                  )}
                  <span className="flex-1 text-sm text-gray-300">{item.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button className="p-1 hover:bg-white/10 rounded">
                      <Copy size={14} className="text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded">
                      <Download size={14} className="text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded">
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-red-500/20 rounded">
                      <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-8 border-t border-white/10 flex items-center px-4 text-xs text-gray-500">
          <span>{currentContents.length} items</span>
          <div className="flex-1" />
          {selectedItems.length > 0 && (
            <span>{selectedItems.length} selected</span>
          )}
        </div>
      </div>
    </div>
  );
}
