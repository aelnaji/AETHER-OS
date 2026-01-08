'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { BytebotSocketManager } from '@/lib/services/bytebotSocketManager';
import { useFileSystemStore } from '@/lib/stores/fileSystemStore';

export interface TerminalCommand {
  command: string;
  output: string[];
  exitCode?: number;
  timestamp: number;
  duration?: number;
  isRunning?: boolean;
}

export interface TerminalSession {
  id: string;
  title: string;
  isActive: boolean;
  history: TerminalCommand[];
  commandHistory: string[];
  historyIndex: number;
  currentInput: string;
  currentDirectory: string;
  isConnected: boolean;
  environment: Record<string, string>;
}

interface UseTerminalOptions {
  socket?: Socket | null;
  socketManager?: BytebotSocketManager;
  maxHistorySize?: number;
  maxCommandHistory?: number;
}

const STORAGE_KEY = 'aether-terminal-state-v1';

type PersistedTerminalState = {
  sessions: TerminalSession[];
  activeSessionId: string;
};

function safeParseState(raw: string | null): PersistedTerminalState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedTerminalState;
    if (!Array.isArray(parsed.sessions) || typeof parsed.activeSessionId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useTerminal(options: UseTerminalOptions = {}) {
  const { socket, socketManager, maxHistorySize = 100, maxCommandHistory = 100 } = options;

  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  const saveDebounceRef = useRef<number | null>(null);

  const createNewSession = useCallback(
    (title: string = `Terminal ${sessions.length + 1}`): TerminalSession => {
      const isConnected = socket?.connected || false;
      return {
        id: `terminal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        isActive: false,
        history: [],
        commandHistory: [],
        historyIndex: -1,
        currentInput: '',
        currentDirectory: '~',
        isConnected,
        environment: {},
      };
    },
    [sessions.length, socket]
  );

  // Hydrate persisted terminal state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const persisted = safeParseState(localStorage.getItem(STORAGE_KEY));

    if (persisted && persisted.sessions.length > 0) {
      const isConnected = socket?.connected || false;
      setSessions(persisted.sessions.map((s) => ({ ...s, isConnected })));
      setActiveSessionId(persisted.activeSessionId || persisted.sessions[0].id);
      return;
    }

    const defaultSession = createNewSession('Terminal 1');
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, [createNewSession, socket?.connected]);

  // Persist terminal state (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessions.length === 0 || !activeSessionId) return;

    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = window.setTimeout(() => {
      const toPersist: PersistedTerminalState = {
        sessions: sessions.map((s) => ({
          ...s,
          isConnected: false,
        })),
        activeSessionId,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    }, 750);

    return () => {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
    };
  }, [sessions, activeSessionId]);

  // Listen to socket events for real-time output
  useEffect(() => {
    if (!socket) return;

    const handleCommandOutput = (data: { sessionId: string; output: string; type: 'stdout' | 'stderr' }) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== data.sessionId) return session;

          const updatedHistory = [...session.history];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand && lastCommand.isRunning) {
            lastCommand.output = [...lastCommand.output, data.output];
          }

          return { ...session, history: updatedHistory };
        })
      );
    };

    const handleCommandComplete = (data: { sessionId: string; exitCode: number; duration: number }) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== data.sessionId) return session;

          const updatedHistory = [...session.history];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand && lastCommand.isRunning) {
            lastCommand.isRunning = false;
            lastCommand.exitCode = data.exitCode;
            lastCommand.duration = data.duration;
          }

          return { ...session, history: updatedHistory };
        })
      );
    };

    socket.on('terminal:output', handleCommandOutput);
    socket.on('terminal:complete', handleCommandComplete);

    return () => {
      socket.off('terminal:output', handleCommandOutput);
      socket.off('terminal:complete', handleCommandComplete);
    };
  }, [socket]);

  // Update connection status for all sessions
  useEffect(() => {
    const updateConnectionStatus = () => {
      const isConnected = socket?.connected || false;
      setSessions((prev) => prev.map((s) => ({ ...s, isConnected })));
    };

    if (!socket) return;

    socket.on('connect', updateConnectionStatus);
    socket.on('disconnect', updateConnectionStatus);
    updateConnectionStatus();

    return () => {
      socket.off('connect', updateConnectionStatus);
      socket.off('disconnect', updateConnectionStatus);
    };
  }, [socket]);

  const addSession = useCallback(
    (title?: string) => {
      const newSession = createNewSession(title);
      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(newSession.id);
      return newSession.id;
    },
    [createNewSession]
  );

  const closeSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);

        if (filtered.length === 0) {
          const defaultSession = createNewSession('Terminal 1');
          setActiveSessionId(defaultSession.id);
          return [defaultSession];
        }

        if (sessionId === activeSessionId) {
          const index = prev.findIndex((s) => s.id === sessionId);
          const newActiveIndex = Math.max(0, index - 1);
          setActiveSessionId(filtered[newActiveIndex].id);
        }

        return filtered;
      });
    },
    [activeSessionId, createNewSession]
  );

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s)));
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const getActiveSession = useCallback(() => sessions.find((s) => s.id === activeSessionId), [sessions, activeSessionId]);

  const setDirectoryFromCd = useCallback(
    (sessionId: string, command: string) => {
      const trimmed = command.trim();
      if (!trimmed.startsWith('cd')) return;

      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const parts = trimmed.split(/\s+/);
      const target = parts[1] || '~';

      let nextDir = session.currentDirectory;
      if (target === '~') {
        nextDir = '~';
      } else if (target.startsWith('/')) {
        nextDir = target;
      } else if (target === '..') {
        const segments = session.currentDirectory.split('/').filter(Boolean);
        segments.pop();
        nextDir = '/' + segments.join('/');
        if (nextDir === '/') nextDir = '/';
      } else {
        const base = session.currentDirectory === '~' ? '/home/user' : session.currentDirectory;
        nextDir = `${base.replace(/\/$/, '')}/${target}`;
      }

      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, currentDirectory: nextDir } : s)));
      useFileSystemStore.getState().setCurrentDirectory(nextDir);
    },
    [sessions]
  );

  const executeCommand = useCallback(
    async (sessionId: string, command: string) => {
      if (!command.trim()) return;

      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const updatedCommandHistory = [...session.commandHistory, command];
      if (updatedCommandHistory.length > maxCommandHistory) updatedCommandHistory.shift();

      const queued = !(socket?.connected || false);

      const commandEntry: TerminalCommand = {
        command,
        output: queued ? ['Queued while offline. Will run on reconnect.'] : [],
        timestamp: Date.now(),
        isRunning: true,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;

          const updatedHistory = [...s.history, commandEntry];
          if (updatedHistory.length > maxHistorySize) updatedHistory.shift();

          return {
            ...s,
            history: updatedHistory,
            commandHistory: updatedCommandHistory,
            historyIndex: -1,
          };
        })
      );

      // Try to anticipate cwd changes for File Explorer + prompt display
      setDirectoryFromCd(sessionId, command);

      if (socketManager) {
        socketManager.emit('terminal:execute', {
          sessionId,
          command,
          cwd: session.currentDirectory,
          environment: session.environment,
        });
        return;
      }

      if (socket) {
        socket.emit('terminal:execute', {
          sessionId,
          command,
          cwd: session.currentDirectory,
          environment: session.environment,
        });
      }
    },
    [sessions, socket, socketManager, maxHistorySize, maxCommandHistory, setDirectoryFromCd]
  );

  const cancelCommand = useCallback(
    (sessionId: string) => {
      if (socketManager) {
        socketManager.emit('terminal:cancel', { sessionId });
      } else if (socket) {
        socket.emit('terminal:cancel', { sessionId });
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;

          const updatedHistory = [...s.history];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand && lastCommand.isRunning) {
            lastCommand.output = [...lastCommand.output, '^C'];
            lastCommand.isRunning = false;
            lastCommand.exitCode = 130;
          }
          return { ...s, history: updatedHistory };
        })
      );
    },
    [socket, socketManager]
  );

  const clearHistory = useCallback((sessionId: string) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, history: [] } : s)));
  }, []);

  const navigateHistory = useCallback(
    (sessionId: string, direction: 'up' | 'down') => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session || session.commandHistory.length === 0) return null;

      let newIndex = session.historyIndex;

      if (direction === 'up') {
        if (newIndex === -1) newIndex = session.commandHistory.length - 1;
        else if (newIndex > 0) newIndex--;
      } else {
        if (newIndex === -1) return '';
        if (newIndex < session.commandHistory.length - 1) newIndex++;
        else {
          newIndex = -1;
          return '';
        }
      }

      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, historyIndex: newIndex } : s)));
      return session.commandHistory[newIndex];
    },
    [sessions]
  );

  const updateEnvironment = useCallback((sessionId: string, env: Record<string, string>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, environment: { ...s.environment, ...env } } : s))
    );
  }, []);

  const getSessionHistory = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId)?.history || [],
    [sessions]
  );

  const getSessionCommandHistory = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId)?.commandHistory || [],
    [sessions]
  );

  return {
    sessions,
    activeSessionId,
    activeSession: getActiveSession(),
    addSession,
    closeSession,
    renameSession,
    switchSession,
    executeCommand,
    cancelCommand,
    clearHistory,
    navigateHistory,
    updateEnvironment,
    getSessionHistory,
    getSessionCommandHistory,
  };
}
