'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Network, Clock, Loader } from 'lucide-react';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { logger } from '@/lib/utils/logger';

interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    received: number;
    sent: number;
    receivedRate: number;
    sentRate: number;
  };
  uptime: number;
  timestamp: number;
}

export function SystemMonitor() {
  const { connected, socket } = useBytebot();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    if (!connected) {
      setLoading(false);
      return;
    }

    // Request system stats
    const fetchStats = () => {
      socket.emit('system:stats', {}, (response: { stats?: SystemStats; error?: string }) => {
        if (response.error) {
          logger.warn('Failed to fetch system stats', response.error);
          return;
        }

        if (response.stats) {
          setStats(response.stats);
          setLoading(false);

          setCpuHistory((prev) => {
            const newHistory = [...prev, response.stats!.cpu.usage];
            if (newHistory.length > 60) newHistory.shift();
            return newHistory;
          });
        }
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, connected]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatNetworkRate = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <Loader size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-gray-500">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4" />
          <p>Not connected to Bytebot backend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-blue-400" />
          <h2 className="text-xl font-semibold text-white">System Monitor</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} />
          <span>Uptime: {formatUptime(stats.uptime)}</span>
        </div>
      </div>

      {/* CPU Section */}
      <div className="bg-[#121212] rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={18} className="text-purple-400" />
          <h3 className="text-lg font-medium text-white">CPU</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Usage</span>
              <span className="text-white font-mono">{stats.cpu.usage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  stats.cpu.usage > 80 ? 'bg-red-400' : stats.cpu.usage > 50 ? 'bg-amber-400' : 'bg-green-400'
                }`}
                style={{ width: `${stats.cpu.usage}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Cores</div>
              <div className="text-white font-mono">{stats.cpu.cores}</div>
            </div>
            <div>
              <div className="text-gray-400">Model</div>
              <div className="text-white font-mono text-xs">{stats.cpu.model.substring(0, 30)}</div>
            </div>
          </div>
          
          {/* CPU History Graph */}
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-2">Usage History (60s)</div>
            <div className="flex items-end gap-0.5 h-20 bg-[#0a0a0a] rounded p-2">
              {cpuHistory.map((usage, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${
                    usage > 80 ? 'bg-red-400' : usage > 50 ? 'bg-amber-400' : 'bg-green-400'
                  }`}
                  style={{ height: `${usage}%` }}
                  title={`${usage.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Memory Section */}
      <div className="bg-[#121212] rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-cyan-400" />
          <h3 className="text-lg font-medium text-white">Memory</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Used</span>
              <span className="text-white font-mono">
                {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  stats.memory.percentage > 80 ? 'bg-red-400' : stats.memory.percentage > 50 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${stats.memory.percentage}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total</div>
              <div className="text-white font-mono">{formatBytes(stats.memory.total)}</div>
            </div>
            <div>
              <div className="text-gray-400">Used</div>
              <div className="text-white font-mono">{formatBytes(stats.memory.used)}</div>
            </div>
            <div>
              <div className="text-gray-400">Free</div>
              <div className="text-white font-mono">{formatBytes(stats.memory.free)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disk Section */}
      <div className="bg-[#121212] rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive size={18} className="text-amber-400" />
          <h3 className="text-lg font-medium text-white">Disk</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Used</span>
              <span className="text-white font-mono">
                {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  stats.disk.percentage > 80 ? 'bg-red-400' : stats.disk.percentage > 50 ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{ width: `${stats.disk.percentage}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total</div>
              <div className="text-white font-mono">{formatBytes(stats.disk.total)}</div>
            </div>
            <div>
              <div className="text-gray-400">Used</div>
              <div className="text-white font-mono">{formatBytes(stats.disk.used)}</div>
            </div>
            <div>
              <div className="text-gray-400">Free</div>
              <div className="text-white font-mono">{formatBytes(stats.disk.free)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Section */}
      <div className="bg-[#121212] rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Network size={18} className="text-green-400" />
          <h3 className="text-lg font-medium text-white">Network</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Received</div>
            <div className="text-white font-mono">{formatBytes(stats.network.received)}</div>
            <div className="text-green-400 text-xs mt-1">↓ {formatNetworkRate(stats.network.receivedRate)}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Sent</div>
            <div className="text-white font-mono">{formatBytes(stats.network.sent)}</div>
            <div className="text-blue-400 text-xs mt-1">↑ {formatNetworkRate(stats.network.sentRate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
