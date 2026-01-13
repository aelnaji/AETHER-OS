'use client';

import React, { useState, useEffect } from 'react';
import { Activity, XCircle, Search, RefreshCw, ArrowUpDown, Loader } from 'lucide-react';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { ShellService, Process } from '@/lib/services/shellService';

type SortField = 'pid' | 'name' | 'cpu' | 'memory';
type SortOrder = 'asc' | 'desc';

interface ProcessManagerProps {
  windowId?: string;
  onClose?: () => void;
}

export function ProcessManager({ windowId, onClose }: ProcessManagerProps = {}) {
  const { connected, executor } = useBytebot();
  const [shellService, setShellService] = useState<ShellService | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize shell service
  useEffect(() => {
    if (executor && executor['socket']) {
      const service = new ShellService(executor['socket']);
      setShellService(service);
    }
  }, [executor]);

  // Load processes
  const loadProcesses = async () => {
    if (!shellService) return;

    try {
      setLoading(true);
      const procs = await shellService.getRunningProcesses();
      setProcesses(procs);
      setFilteredProcesses(procs);
    } catch (error) {
      console.error('Failed to load processes:', error);
      setProcesses([]);
      setFilteredProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh processes
  useEffect(() => {
    if (!shellService || !autoRefresh) return;

    loadProcesses();
    const interval = setInterval(loadProcesses, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [shellService, autoRefresh]);

  // Filter and sort processes
  useEffect(() => {
    let filtered = [...processes];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(proc =>
        proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc.pid.toString().includes(searchQuery)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'pid':
          aVal = a.pid;
          bVal = b.pid;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'cpu':
          aVal = a.cpu;
          bVal = b.cpu;
          break;
        case 'memory':
          aVal = a.memory;
          bVal = b.memory;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' 
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    setFilteredProcesses(filtered);
  }, [processes, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleKillProcess = async (pid: number, processName: string) => {
    if (!shellService) return;

    if (!confirm(`Are you sure you want to kill process "${processName}" (PID: ${pid})?`)) {
      return;
    }

    try {
      await shellService.killProcess(pid);
      loadProcesses();
    } catch (error) {
      alert(`Failed to kill process: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatMemory = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" />;
    }
    return (
      <span className="text-purple-400">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (loading && processes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <Loader size={32} className="animate-spin text-purple-400" />
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
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121212]">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Process Manager</h2>
          <span className="text-sm text-gray-400">({filteredProcesses.length} processes)</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={loadProcesses}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, command, user, or PID..."
            className="flex-1 bg-transparent text-gray-300 text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Process List */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#0f0f0f] border-b border-white/10">
            <tr className="text-left text-xs text-gray-400">
              <th
                onClick={() => handleSort('pid')}
                className="px-4 py-2 font-medium cursor-pointer hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  PID
                  <SortIcon field="pid" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="px-4 py-2 font-medium cursor-pointer hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-4 py-2 font-medium">User</th>
              <th
                onClick={() => handleSort('cpu')}
                className="px-4 py-2 font-medium cursor-pointer hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  CPU %
                  <SortIcon field="cpu" />
                </div>
              </th>
              <th
                onClick={() => handleSort('memory')}
                className="px-4 py-2 font-medium cursor-pointer hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  Memory
                  <SortIcon field="memory" />
                </div>
              </th>
              <th className="px-4 py-2 font-medium">Command</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProcesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No processes found
                </td>
              </tr>
            ) : (
              filteredProcesses.map((proc) => (
                <tr
                  key={proc.pid}
                  onClick={() => setSelectedProcess(proc)}
                  className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                    selectedProcess?.pid === proc.pid ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-white font-mono">{proc.pid}</td>
                  <td className="px-4 py-3 text-sm text-white">{proc.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{proc.user}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-mono ${
                      proc.cpu > 50 ? 'text-red-400' : proc.cpu > 20 ? 'text-amber-400' : 'text-green-400'
                    }`}>
                      {proc.cpu.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                    {formatMemory(proc.memory)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs" title={proc.command}>
                    {proc.command}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKillProcess(proc.pid, proc.name);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Kill Process"
                    >
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Panel */}
      {selectedProcess && (
        <div className="border-t border-white/10 bg-[#121212] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Process Details</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-gray-400 mb-1">PID</div>
              <div className="text-white font-mono">{selectedProcess.pid}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Name</div>
              <div className="text-white">{selectedProcess.name}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">User</div>
              <div className="text-white">{selectedProcess.user}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">CPU Usage</div>
              <div className="text-white font-mono">{selectedProcess.cpu.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Memory Usage</div>
              <div className="text-white font-mono">{formatMemory(selectedProcess.memory)}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Command</div>
              <div className="text-white font-mono text-xs truncate" title={selectedProcess.command}>
                {selectedProcess.command}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
