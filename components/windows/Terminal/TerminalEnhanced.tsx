'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal as TerminalIcon, Plus, X, Trash2, Copy, Edit2, Check } from 'lucide-react';
import { useBytebot } from '@/lib/hooks/useBytebot';
import { useTerminal } from '@/lib/hooks/useTerminal';

interface TerminalEnhancedProps {
  windowId?: string;
  onClose?: () => void;
}

export function TerminalEnhanced({ windowId, onClose }: TerminalEnhancedProps = {}) {
  const { connected, executor } = useBytebot();
  const terminal = useTerminal({ socket: executor?.['socket'] });
  const [inputValue, setInputValue] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminal.activeSession?.history]);

  // Focus input on mount and tab switch
  useEffect(() => {
    inputRef.current?.focus();
  }, [terminal.activeSessionId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim() || !terminal.activeSessionId) return;
    
    await terminal.executeCommand(terminal.activeSessionId, inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (terminal.activeSessionId) {
        const cmd = terminal.navigateHistory(terminal.activeSessionId, 'up');
        if (cmd !== null) {
          setInputValue(cmd);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (terminal.activeSessionId) {
        const cmd = terminal.navigateHistory(terminal.activeSessionId, 'down');
        if (cmd !== null) {
          setInputValue(cmd);
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (terminal.activeSessionId) {
        terminal.cancelCommand(terminal.activeSessionId);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      if (terminal.activeSessionId) {
        terminal.clearHistory(terminal.activeSessionId);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.ctrlKey && !e.shiftKey) {
        // Ctrl+Tab - next tab
        const currentIndex = terminal.sessions.findIndex(s => s.id === terminal.activeSessionId);
        const nextIndex = (currentIndex + 1) % terminal.sessions.length;
        terminal.switchSession(terminal.sessions[nextIndex].id);
      } else if (e.ctrlKey && e.shiftKey) {
        // Ctrl+Shift+Tab - previous tab
        const currentIndex = terminal.sessions.findIndex(s => s.id === terminal.activeSessionId);
        const prevIndex = (currentIndex - 1 + terminal.sessions.length) % terminal.sessions.length;
        terminal.switchSession(terminal.sessions[prevIndex].id);
      }
    }
  };

  const getLineColor = (exitCode?: number, isRunning?: boolean) => {
    if (isRunning) return 'text-amber-400';
    if (exitCode === undefined) return 'text-gray-300';
    if (exitCode === 0) return 'text-green-400';
    return 'text-red-400';
  };

  const highlightCommand = (command: string) => {
    // Simple syntax highlighting
    const keywords = ['sudo', 'apt', 'npm', 'node', 'python', 'pip', 'cd', 'ls', 'cat', 'grep', 'echo', 'mkdir', 'rm', 'cp', 'mv'];
    const parts = command.split(' ');
    
    return parts.map((part, i) => {
      if (i === 0 && keywords.includes(part)) {
        return <span key={i} className="text-purple-400">{part} </span>;
      } else if (part.startsWith('-')) {
        return <span key={i} className="text-cyan-400">{part} </span>;
      } else if (part.startsWith('/') || part.startsWith('./') || part.startsWith('~/')) {
        return <span key={i} className="text-blue-400">{part} </span>;
      }
      return <span key={i} className="text-gray-300">{part} </span>;
    });
  };

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startEditingTab = (sessionId: string, currentTitle: string) => {
    setEditingTabId(sessionId);
    setEditingTabName(currentTitle);
  };

  const finishEditingTab = () => {
    if (editingTabId && editingTabName.trim()) {
      terminal.renameSession(editingTabId, editingTabName.trim());
    }
    setEditingTabId(null);
    setEditingTabName('');
  };

  const currentSession = terminal.activeSession;
  const isRunningCommand = currentSession?.history[currentSession.history.length - 1]?.isRunning;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Tabs Bar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10 bg-[#121212] overflow-x-auto">
        {terminal.sessions.map((session) => (
          <div
            key={session.id}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors ${
              session.id === terminal.activeSessionId
                ? 'bg-[#0a0a0a] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-300'
            }`}
            onClick={() => terminal.switchSession(session.id)}
          >
            {editingTabId === session.id ? (
              <input
                type="text"
                value={editingTabName}
                onChange={(e) => setEditingTabName(e.target.value)}
                onBlur={finishEditingTab}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishEditingTab();
                  if (e.key === 'Escape') {
                    setEditingTabId(null);
                    setEditingTabName('');
                  }
                }}
                className="bg-[#0a0a0a] border border-amber-500 rounded px-2 py-0.5 text-xs w-24 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="text-xs">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingTab(session.id, session.title);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                  title="Rename"
                >
                  <Edit2 size={10} />
                </button>
              </>
            )}
            {terminal.sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  terminal.closeSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                title="Close"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => terminal.addSession()}
          className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          title="New Terminal (Ctrl+Shift+T)"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#121212]">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-amber-400" />
          <span className="text-sm text-gray-400">{currentSession?.currentDirectory || '~'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (terminal.activeSessionId) {
                terminal.clearHistory(terminal.activeSessionId);
              }
            }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            title="Clear Terminal (Ctrl+L)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        <div className="space-y-1">
          {!currentSession || currentSession.history.length === 0 ? (
            <div className="text-gray-500">
              <p>AETHER Terminal - Multi-tab Shell</p>
              <p className="text-xs mt-2">Connected to Bytebot Backend</p>
              <p className="text-xs mt-1">Keyboard shortcuts:</p>
              <ul className="text-xs mt-1 ml-4 space-y-0.5">
                <li>Ctrl+L - Clear screen</li>
                <li>Ctrl+C - Cancel command</li>
                <li>Up/Down - Navigate history</li>
                <li>Ctrl+Tab - Next tab</li>
                <li>Ctrl+Shift+Tab - Previous tab</li>
              </ul>
            </div>
          ) : (
            currentSession.history.map((cmd, index) => (
              <div key={index} className="space-y-0.5">
                {/* Command line */}
                <div className="flex items-start group">
                  <span className="text-green-400 mr-2 shrink-0">$</span>
                  <span className="flex-1">{highlightCommand(cmd.command)}</span>
                  <button
                    onClick={() => copyOutput(cmd.command)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                    title="Copy"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                
                {/* Output */}
                {cmd.output.map((line, lineIndex) => (
                  <div key={lineIndex} className="text-gray-300 ml-4 break-all">
                    {line}
                  </div>
                ))}
                
                {/* Status line */}
                {cmd.isRunning ? (
                  <div className="text-amber-400 ml-4 text-xs">
                    <span className="inline-block animate-pulse">▶ Running...</span>
                  </div>
                ) : cmd.exitCode !== undefined && (
                  <div className={`ml-4 text-xs flex items-center gap-2 ${getLineColor(cmd.exitCode, cmd.isRunning)}`}>
                    {cmd.exitCode === 0 ? (
                      <span>✓ Success</span>
                    ) : (
                      <span>✗ Exit code: {cmd.exitCode}</span>
                    )}
                    {cmd.duration && (
                      <span className="text-gray-500">({(cmd.duration / 1000).toFixed(2)}s)</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {isRunningCommand && (
            <div className="text-gray-400 text-xs">
              <span className="mr-2">Press Ctrl+C to cancel</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-1.5 border-t border-white/10 bg-[#121212]">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-400">
            {connected ? 'Connected to Bytebot' : 'Disconnected - Reconnecting...'}
          </span>
          {currentSession && (
            <>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">
                {currentSession.commandHistory.length} commands in history
              </span>
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 bg-[#121212]">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            disabled={!currentSession}
            className="flex-1 bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-mono"
          />
        </div>
      </form>
    </div>
  );
}
