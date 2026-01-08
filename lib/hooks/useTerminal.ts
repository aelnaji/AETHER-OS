'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

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
  commandHistory: string[]; // For up/down arrow navigation
  historyIndex: number;
  currentInput: string;
  currentDirectory: string;
  isConnected: boolean;
  environment: Record<string, string>;
}

interface UseTerminalOptions {
  socket?: Socket | null;
  maxHistorySize?: number;
  maxCommandHistory?: number;
}

export function useTerminal(options: UseTerminalOptions = {}) {
  const { socket, maxHistorySize = 100, maxCommandHistory = 100 } = options;
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const commandTimeouts = useRef<Map<string, number>>(new Map());

  // Initialize with default session
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultSession = createNewSession('Terminal 1');
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
    }
  }, []);

  // Listen to socket events for real-time output
  useEffect(() => {
    if (!socket) return;

    const handleCommandOutput = (data: { sessionId: string; output: string; type: 'stdout' | 'stderr' }) => {
      setSessions(prev => prev.map(session => {
        if (session.id === data.sessionId) {
          const updatedHistory = [...session.history];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand && lastCommand.isRunning) {
            lastCommand.output.push(data.output);
          }
          return { ...session, history: updatedHistory };
        }
        return session;
      }));
    };

    const handleCommandComplete = (data: { sessionId: string; exitCode: number; duration: number }) => {
      setSessions(prev => prev.map(session => {
        if (session.id === data.sessionId) {
          const updatedHistory = [...session.history];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand && lastCommand.isRunning) {
            lastCommand.isRunning = false;
            lastCommand.exitCode = data.exitCode;
            lastCommand.duration = data.duration;
          }
          return { ...session, history: updatedHistory };
        }
        return session;
      }));
    };

    socket.on('terminal:output', handleCommandOutput);
    socket.on('terminal:complete', handleCommandComplete);

    return () => {
      socket.off('terminal:output', handleCommandOutput);
      socket.off('terminal:complete', handleCommandComplete);
    };
  }, [socket]);

  const createNewSession = (title: string = `Terminal ${sessions.length + 1}`): TerminalSession => {
    return {
      id: `terminal-${Date.now()}-${Math.random()}`,
      title,
      isActive: false,
      history: [],
      commandHistory: [],
      historyIndex: -1,
      currentInput: '',
      currentDirectory: '~',
      isConnected: socket?.connected || false,
      environment: {},
    };
  };

  const addSession = useCallback((title?: string) => {
    const newSession = createNewSession(title);
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [sessions.length, socket]);

  const closeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        // Always keep at least one session
        const defaultSession = createNewSession('Terminal 1');
        setActiveSessionId(defaultSession.id);
        return [defaultSession];
      }
      
      // If closing active session, switch to another
      if (sessionId === activeSessionId) {
        const index = prev.findIndex(s => s.id === sessionId);
        const newActiveIndex = Math.max(0, index - 1);
        setActiveSessionId(filtered[newActiveIndex].id);
      }
      
      return filtered;
    });
  }, [activeSessionId]);

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, title: newTitle } : session
    ));
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const getActiveSession = useCallback(() => {
    return sessions.find(s => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  const executeCommand = useCallback(async (sessionId: string, command: string) => {
    if (!command.trim()) return;

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Add to command history
    const updatedCommandHistory = [...session.commandHistory, command];
    if (updatedCommandHistory.length > maxCommandHistory) {
      updatedCommandHistory.shift();
    }

    // Create command entry
    const commandEntry: TerminalCommand = {
      command,
      output: [],
      timestamp: Date.now(),
      isRunning: true,
    };

    // Update session
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const updatedHistory = [...s.history, commandEntry];
        if (updatedHistory.length > maxHistorySize) {
          updatedHistory.shift();
        }
        return {
          ...s,
          history: updatedHistory,
          commandHistory: updatedCommandHistory,
          historyIndex: -1,
        };
      }
      return s;
    }));

    // Execute command via socket
    if (socket && socket.connected) {
      try {
        socket.emit('terminal:execute', {
          sessionId,
          command,
          cwd: session.currentDirectory,
          environment: session.environment,
        });
      } catch (error) {
        // Handle error
        const errorOutput = error instanceof Error ? error.message : 'Command execution failed';
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            const updatedHistory = [...s.history];
            const lastCommand = updatedHistory[updatedHistory.length - 1];
            if (lastCommand) {
              lastCommand.output.push(errorOutput);
              lastCommand.isRunning = false;
              lastCommand.exitCode = 1;
            }
            return { ...s, history: updatedHistory };
          }
          return s;
        }));
      }
    } else {
      // Simulate execution if not connected
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          const updatedHistory = [...s.history];
          const lastCommand = updatedHistory[updatedHistory.length - 1];
          if (lastCommand) {
            lastCommand.output.push('Not connected to backend. Command not executed.');
            lastCommand.isRunning = false;
            lastCommand.exitCode = 127;
          }
          return { ...s, history: updatedHistory };
        }
        return s;
      }));
    }
  }, [sessions, socket, maxHistorySize, maxCommandHistory]);

  const cancelCommand = useCallback((sessionId: string) => {
    if (socket && socket.connected) {
      socket.emit('terminal:cancel', { sessionId });
    }
    
    // Mark current running command as cancelled
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const updatedHistory = [...s.history];
        const lastCommand = updatedHistory[updatedHistory.length - 1];
        if (lastCommand && lastCommand.isRunning) {
          lastCommand.output.push('^C');
          lastCommand.isRunning = false;
          lastCommand.exitCode = 130; // SIGINT
        }
        return { ...s, history: updatedHistory };
      }
      return s;
    }));
  }, [socket]);

  const clearHistory = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, history: [] } : s
    ));
  }, []);

  const navigateHistory = useCallback((sessionId: string, direction: 'up' | 'down') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.commandHistory.length === 0) return null;

    let newIndex = session.historyIndex;
    
    if (direction === 'up') {
      if (newIndex === -1) {
        newIndex = session.commandHistory.length - 1;
      } else if (newIndex > 0) {
        newIndex--;
      }
    } else {
      if (newIndex === -1) {
        return '';
      } else if (newIndex < session.commandHistory.length - 1) {
        newIndex++;
      } else {
        newIndex = -1;
        return '';
      }
    }

    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, historyIndex: newIndex } : s
    ));

    return session.commandHistory[newIndex];
  }, [sessions]);

  const updateCurrentDirectory = useCallback((sessionId: string, directory: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, currentDirectory: directory } : s
    ));
  }, []);

  const updateEnvironment = useCallback((sessionId: string, env: Record<string, string>) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, environment: { ...s.environment, ...env } } : s
    ));
  }, []);

  const getSessionHistory = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.history || [];
  }, [sessions]);

  const getSessionCommandHistory = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.commandHistory || [];
  }, [sessions]);

  // Update connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      const isConnected = socket?.connected || false;
      setSessions(prev => prev.map(s => ({ ...s, isConnected })));
    };

    if (socket) {
      socket.on('connect', updateConnectionStatus);
      socket.on('disconnect', updateConnectionStatus);
      updateConnectionStatus();

      return () => {
        socket.off('connect', updateConnectionStatus);
        socket.off('disconnect', updateConnectionStatus);
      };
    }
  }, [socket]);

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
    updateCurrentDirectory,
    updateEnvironment,
    getSessionHistory,
    getSessionCommandHistory,
  };
}
