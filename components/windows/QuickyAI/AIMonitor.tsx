'use client';

import React, { useEffect, useState } from 'react';
import { useQuickyAI } from '@/lib/hooks/useQuickyAI';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { AIActivity } from '@/lib/types/ai';

export interface AIMonitorProps {
  windowId?: string;
  onClose?: () => void;
}

export function AIMonitor({ windowId, onClose }: AIMonitorProps) {
  const { activities, currentActivity, models } = useQuickyAI();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    processing: 0,
    totalCost: 0,
    totalTokens: 0,
  });

  // Calculate stats
  useEffect(() => {
    const newStats = activities.reduce(
      (acc, activity) => {
        acc.total++;
        if (activity.status === 'completed') acc.completed++;
        if (activity.status === 'error') acc.errors++;
        if (activity.status === 'processing') acc.processing++;
        if (activity.metadata?.cost) acc.totalCost += activity.metadata.cost;
        if (activity.metadata?.tokens) acc.totalTokens += activity.metadata.tokens;
        return acc;
      },
      {
        total: 0,
        completed: 0,
        errors: 0,
        processing: 0,
        totalCost: 0,
        totalTokens: 0,
      }
    );
    setStats(newStats);
  }, [activities]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      case 'processing':
        return <Loader2 size={16} className="text-blue-400 animate-spin" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat':
        return 'text-purple-400 bg-purple-500/10';
      case 'image':
        return 'text-blue-400 bg-blue-500/10';
      case 'voice':
        return 'text-green-400 bg-green-500/10';
      case 'video':
        return 'text-red-400 bg-red-500/10';
      case 'ocr':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Activity size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Monitor</h2>
            <p className="text-xs text-gray-500">Real-time Activity Tracking</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-white/10">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Total Requests</span>
            <Activity size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Completed</span>
            <CheckCircle2 size={16} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.completed}</div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Total Tokens</span>
            <Zap size={16} className="text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(stats.totalTokens / 1000).toFixed(1)}K
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Est. Cost</span>
            <DollarSign size={16} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${stats.totalCost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Current Activity */}
      {currentActivity && (
        <div className="p-4 border-b border-white/10 bg-[#141414]">
          <div className="flex items-start gap-3">
            <div className="mt-1">{getStatusIcon(currentActivity.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(
                    currentActivity.type
                  )}`}
                >
                  {currentActivity.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {currentActivity.model}
                </span>
              </div>
              <div className="text-sm text-white mb-1">
                {currentActivity.status === 'processing' ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Processing request...
                  </span>
                ) : currentActivity.status === 'completed' ? (
                  'Request completed successfully'
                ) : currentActivity.status === 'error' ? (
                  <span className="text-red-400">
                    Error: {currentActivity.error}
                  </span>
                ) : (
                  'Pending...'
                )}
              </div>
              {currentActivity.metadata?.prompt && (
                <div className="text-xs text-gray-500 line-clamp-2">
                  Prompt: {currentActivity.metadata.prompt}
                </div>
              )}
              {currentActivity.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentActivity.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} />
          Activity Timeline
        </h3>
        
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mx-auto mb-3">
              <Activity size={24} className="text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm">No activity yet</p>
            <p className="text-gray-600 text-xs mt-1">
              Start using Quicky AI to see real-time activity
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(activity.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(
                          activity.type
                        )}`}
                      >
                        {activity.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.model}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {activity.metadata?.prompt && (
                      <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {activity.metadata.prompt}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      {activity.metadata?.tokens && (
                        <span className="flex items-center gap-1">
                          <Zap size={10} />
                          {activity.metadata.tokens} tokens
                        </span>
                      )}
                      {activity.metadata?.cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={10} />
                          ${activity.metadata.cost.toFixed(4)}
                        </span>
                      )}
                    </div>

                    {activity.error && (
                      <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                        {activity.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
