'use client';

import React, { useState, useEffect } from 'react';
import { Package, Search, Download, Trash2, RefreshCw, Info, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { AptService, Package as AptPackage, PackageInfo, SystemInfo } from '@/lib/services/aptService';
import { logger } from '@/lib/utils/logger';

type ViewMode = 'installed' | 'updates' | 'all';

export function PackageManager() {
  const { connected, socket } = useBytebot();
  const [aptService, setAptService] = useState<AptService | null>(null);
  const [packages, setPackages] = useState<AptPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<AptPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('installed');
  const [selectedPackage, setSelectedPackage] = useState<AptPackage | null>(null);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [operationStatus, setOperationStatus] = useState<{
    type: 'install' | 'remove' | 'update' | 'upgrade' | null;
    packageName?: string;
    progress: number;
    message: string;
  }>({ type: null, progress: 0, message: '' });

  // Initialize APT service
  useEffect(() => {
    if (!socket) return;
    const service = new AptService(socket);
    setAptService(service);
    loadSystemInfo(service);
    loadPackages(service, viewMode);
  }, [socket]);

  const loadSystemInfo = async (service: AptService) => {
    try {
      const info = await service.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      logger.warn('Failed to load system info', error);
    }
  };

  const loadPackages = async (service: AptService, mode: ViewMode) => {
    setLoading(true);
    try {
      let pkgs: AptPackage[] = [];
      if (mode === 'installed') {
        pkgs = await service.listInstalledPackages();
      } else if (mode === 'updates') {
        pkgs = await service.listUpgradable();
      } else {
        // For 'all', we'll show installed packages by default
        pkgs = await service.listInstalledPackages();
      }
      setPackages(pkgs);
      setFilteredPackages(pkgs);
    } catch (error) {
      logger.warn('Failed to load packages', error);
      setPackages([]);
      setFilteredPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredPackages(packages);
      return;
    }

    if (aptService && viewMode === 'all') {
      // Search all packages
      try {
        setLoading(true);
        const results = await aptService.searchPackages(query);
        setFilteredPackages(results);
      } catch (error) {
        logger.warn('Search failed', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Filter current packages
      const filtered = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(query.toLowerCase()) ||
        pkg.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPackages(filtered);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSearchQuery('');
    if (aptService) {
      loadPackages(aptService, mode);
    }
  };

  const handleSelectPackage = async (pkg: AptPackage) => {
    setSelectedPackage(pkg);
    if (aptService) {
      try {
        const info = await aptService.getPackageInfo(pkg.name);
        setPackageInfo(info);
      } catch (error) {
        logger.warn('Failed to load package info', error);
        setPackageInfo(null);
      }
    }
  };

  const handleInstall = async (packageName: string) => {
    if (!aptService) return;
    
    try {
      setOperationStatus({ type: 'install', packageName, progress: 0, message: 'Installing...' });
      
      await aptService.installPackage(packageName, (operation) => {
        setOperationStatus({
          type: 'install',
          packageName,
          progress: operation.progress,
          message: operation.status,
        });
      });
      
      setOperationStatus({ type: null, progress: 0, message: '' });
      
      // Reload packages
      if (aptService) {
        loadPackages(aptService, viewMode);
        loadSystemInfo(aptService);
      }
    } catch (error) {
      logger.warn('Installation failed', error);
      setOperationStatus({ type: null, progress: 0, message: '' });
      alert(`Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemove = async (packageName: string) => {
    if (!aptService) return;
    
    if (!confirm(`Are you sure you want to remove ${packageName}?`)) {
      return;
    }
    
    try {
      setOperationStatus({ type: 'remove', packageName, progress: 0, message: 'Removing...' });
      
      await aptService.removePackage(packageName, (operation) => {
        setOperationStatus({
          type: 'remove',
          packageName,
          progress: operation.progress,
          message: operation.status,
        });
      });
      
      setOperationStatus({ type: null, progress: 0, message: '' });
      
      // Reload packages
      if (aptService) {
        loadPackages(aptService, viewMode);
        loadSystemInfo(aptService);
      }
    } catch (error) {
      logger.warn('Removal failed', error);
      setOperationStatus({ type: null, progress: 0, message: '' });
      alert(`Removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateCache = async () => {
    if (!aptService) return;
    
    try {
      setLoading(true);
      await aptService.updateCache();
      loadSystemInfo(aptService);
      alert('Package cache updated successfully');
    } catch (error) {
      logger.warn('Cache update failed', error);
      alert(`Cache update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeAll = async () => {
    if (!aptService) return;
    
    if (!confirm('Are you sure you want to upgrade all packages?')) {
      return;
    }
    
    try {
      setOperationStatus({ type: 'upgrade', progress: 0, message: 'Upgrading...' });
      
      await aptService.upgradeAll((operation) => {
        setOperationStatus({
          type: 'upgrade',
          progress: operation.progress,
          message: operation.status,
        });
      });
      
      setOperationStatus({ type: null, progress: 0, message: '' });
      
      // Reload packages
      if (aptService) {
        loadPackages(aptService, viewMode);
        loadSystemInfo(aptService);
      }
    } catch (error) {
      logger.warn('Upgrade failed', error);
      setOperationStatus({ type: null, progress: 0, message: '' });
      alert(`Upgrade failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121212]">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Package Manager</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdateCache}
            disabled={!connected || loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Update Cache
          </button>
          {viewMode === 'updates' && (
            <button
              onClick={handleUpgradeAll}
              disabled={!connected || loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              <Download size={14} />
              Upgrade All
            </button>
          )}
        </div>
      </div>

      {/* System Info Bar */}
      {systemInfo && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0f0f0f] text-xs text-gray-400">
          <span>Total: {systemInfo.totalPackages} packages</span>
          <span>Installed: {systemInfo.installedPackages}</span>
          <span>Upgradable: {systemInfo.upgradablePackages}</span>
          <span>Disk Usage: {systemInfo.diskUsage}</span>
          <span>Last Update: {systemInfo.lastUpdate}</span>
        </div>
      )}

      {/* Operation Status */}
      {operationStatus.type && (
        <div className="px-4 py-3 border-b border-white/10 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <Loader size={16} className="animate-spin text-amber-400" />
            <div className="flex-1">
              <div className="text-sm text-white mb-1">{operationStatus.message}</div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${operationStatus.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-white/10 bg-[#0f0f0f] p-2 space-y-1">
          <button
            onClick={() => handleViewModeChange('installed')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'installed' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <CheckCircle size={14} className="inline mr-2" />
            Installed
          </button>
          <button
            onClick={() => handleViewModeChange('updates')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'updates' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <RefreshCw size={14} className="inline mr-2" />
            Updates
          </button>
          <button
            onClick={() => handleViewModeChange('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMode === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Package size={14} className="inline mr-2" />
            All Packages
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search packages..."
                className="flex-1 bg-transparent text-gray-300 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Package List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader size={32} className="animate-spin text-purple-400" />
              </div>
            ) : !connected ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <XCircle size={48} className="mx-auto mb-4" />
                  <p>Not connected to Bytebot backend</p>
                </div>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No packages found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-[#0f0f0f] border-b border-white/10">
                  <tr className="text-left text-xs text-gray-400">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Version</th>
                    <th className="px-4 py-2 font-medium">Size</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((pkg) => (
                    <tr
                      key={pkg.name}
                      onClick={() => handleSelectPackage(pkg)}
                      className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                        selectedPackage?.name === pkg.name ? 'bg-purple-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-white">{pkg.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{pkg.version}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{pkg.size}</td>
                      <td className="px-4 py-3 text-sm">
                        {pkg.installed ? (
                          <span className="text-green-400">Installed</span>
                        ) : (
                          <span className="text-gray-500">Not Installed</span>
                        )}
                        {pkg.upgradable && (
                          <span className="ml-2 text-amber-400">(Upgradable)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {pkg.installed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(pkg.name);
                              }}
                              disabled={operationStatus.type !== null}
                              className="p-1.5 rounded hover:bg-red-500/20 text-red-400 disabled:opacity-50"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstall(pkg.name);
                              }}
                              disabled={operationStatus.type !== null}
                              className="p-1.5 rounded hover:bg-green-500/20 text-green-400 disabled:opacity-50"
                              title="Install"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPackage(pkg);
                            }}
                            className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400"
                            title="Info"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedPackage && (
          <div className="w-80 border-l border-white/10 bg-[#0f0f0f] p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">{selectedPackage.name}</h3>
            
            {packageInfo ? (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Version</div>
                  <div className="text-white">{packageInfo.version}</div>
                </div>
                
                <div>
                  <div className="text-gray-400 mb-1">Description</div>
                  <div className="text-gray-300">{packageInfo.description}</div>
                </div>
                
                {packageInfo.homepage && (
                  <div>
                    <div className="text-gray-400 mb-1">Homepage</div>
                    <a href={packageInfo.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {packageInfo.homepage}
                    </a>
                  </div>
                )}
                
                <div>
                  <div className="text-gray-400 mb-1">Maintainer</div>
                  <div className="text-gray-300">{packageInfo.maintainer}</div>
                </div>
                
                <div>
                  <div className="text-gray-400 mb-1">Size</div>
                  <div className="text-gray-300">
                    Download: {packageInfo.size}<br />
                    Installed: {packageInfo.installedSize}
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-400 mb-1">Section</div>
                  <div className="text-gray-300">{packageInfo.section}</div>
                </div>
                
                {packageInfo.dependencies.length > 0 && (
                  <div>
                    <div className="text-gray-400 mb-1">Dependencies</div>
                    <div className="text-gray-300 text-xs space-y-0.5">
                      {packageInfo.dependencies.map((dep, i) => (
                        <div key={i}>{dep}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <Loader size={24} className="animate-spin text-purple-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
