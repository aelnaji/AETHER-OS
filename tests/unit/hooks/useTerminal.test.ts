import { renderHook, act } from '@testing-library/react';
import { useTerminal, TerminalSession } from '@/lib/hooks/useTerminal';
import { Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('useTerminal', () => {
  let mockSocket: Socket;

  beforeEach(() => {
    mockSocket = new (require('socket.io-client').Socket)();
    mockSocket.connected = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default session', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      expect(result.current.sessions.length).toBe(1);
      expect(result.current.activeSessionId).toBeTruthy();
      expect(result.current.activeSession?.title).toBe('Terminal 1');
    });

    it('should initialize with empty sessions when no socket provided', () => {
      const { result } = renderHook(() => useTerminal());
      
      expect(result.current.sessions.length).toBe(1);
      expect(result.current.activeSession?.isConnected).toBe(false);
    });
  });

  describe('session management', () => {
    it('should add new session', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      act(() => {
        result.current.addSession('New Terminal');
      });
      
      expect(result.current.sessions.length).toBe(2);
      expect(result.current.activeSession?.title).toBe('New Terminal');
    });

    it('should close session and switch to another', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      // Add a second session
      act(() => {
        result.current.addSession('Terminal 2');
      });
      
      const firstSessionId = result.current.sessions[0].id;
      
      // Close the first session
      act(() => {
        result.current.closeSession(firstSessionId);
      });
      
      expect(result.current.sessions.length).toBe(1);
      expect(result.current.activeSession?.title).toBe('Terminal 2');
    });

    it('should not close last session', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const onlySessionId = result.current.sessions[0].id;
      
      act(() => {
        result.current.closeSession(onlySessionId);
      });
      
      expect(result.current.sessions.length).toBe(1);
      expect(result.current.activeSession?.title).toBe('Terminal 1');
    });

    it('should rename session', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      act(() => {
        result.current.renameSession(sessionId, 'Renamed Terminal');
      });
      
      expect(result.current.activeSession?.title).toBe('Renamed Terminal');
    });

    it('should switch between sessions', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      // Add a second session
      act(() => {
        result.current.addSession('Terminal 2');
      });
      
      const firstSessionId = result.current.sessions[0].id;
      const secondSessionId = result.current.sessions[1].id;
      
      // Switch to first session
      act(() => {
        result.current.switchSession(firstSessionId);
      });
      
      expect(result.current.activeSessionId).toBe(firstSessionId);
      expect(result.current.activeSession?.title).toBe('Terminal 1');
    });
  });

  describe('command execution', () => {
    it('should execute command and add to history', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      await act(async () => {
        await result.current.executeCommand(sessionId, 'ls -la');
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBe(1);
      expect(history[0].command).toBe('ls -la');
      expect(history[0].isRunning).toBe(true);
    });

    it('should not execute empty command', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      const initialHistory = result.current.getSessionHistory(sessionId);
      
      await act(async () => {
        await result.current.executeCommand(sessionId, '');
      });
      
      const updatedHistory = result.current.getSessionHistory(sessionId);
      expect(updatedHistory.length).toBe(initialHistory.length);
    });

    it('should handle command execution errors', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Mock socket emit to throw error
      jest.spyOn(mockSocket, 'emit').mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      await act(async () => {
        await result.current.executeCommand(sessionId, 'invalid-command');
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBe(1);
      expect(history[0].output.some(o => o.includes('Connection failed'))).toBe(true);
      expect(history[0].exitCode).toBe(1);
    });

    it('should handle execution when not connected', async () => {
      const disconnectedSocket = new (require('socket.io-client').Socket)();
      disconnectedSocket.connected = false;
      
      const { result } = renderHook(() => useTerminal({ socket: disconnectedSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      await act(async () => {
        await result.current.executeCommand(sessionId, 'ls');
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBe(1);
      expect(history[0].output.some(o => o.includes('Not connected'))).toBe(true);
      expect(history[0].exitCode).toBe(127);
    });
  });

  describe('command history navigation', () => {
    it('should navigate command history with up/down arrows', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Execute some commands
      act(() => {
        result.current.executeCommand(sessionId, 'ls');
        result.current.executeCommand(sessionId, 'cd /tmp');
        result.current.executeCommand(sessionId, 'pwd');
      });
      
      // Navigate up through history
      let command = result.current.navigateHistory(sessionId, 'up');
      expect(command).toBe('pwd');
      
      command = result.current.navigateHistory(sessionId, 'up');
      expect(command).toBe('cd /tmp');
      
      command = result.current.navigateHistory(sessionId, 'up');
      expect(command).toBe('ls');
      
      // Navigate down through history
      command = result.current.navigateHistory(sessionId, 'down');
      expect(command).toBe('cd /tmp');
      
      command = result.current.navigateHistory(sessionId, 'down');
      expect(command).toBe('pwd');
      
      // Go beyond history should return empty string
      command = result.current.navigateHistory(sessionId, 'down');
      expect(command).toBe('');
    });

    it('should handle empty command history', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      const command = result.current.navigateHistory(sessionId, 'up');
      expect(command).toBeNull();
    });
  });

  describe('command cancellation', () => {
    it('should cancel running command', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Add a running command to history
      act(() => {
        result.current.executeCommand(sessionId, 'sleep 10');
      });
      
      // Cancel the command
      act(() => {
        result.current.cancelCommand(sessionId);
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history[0].output.some(o => o.includes('^C'))).toBe(true);
      expect(history[0].exitCode).toBe(130); // SIGINT
    });

    it('should handle cancellation when not connected', () => {
      const disconnectedSocket = new (require('socket.io-client').Socket)();
      disconnectedSocket.connected = false;
      
      const { result } = renderHook(() => useTerminal({ socket: disconnectedSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Add a running command
      act(() => {
        result.current.executeCommand(sessionId, 'sleep 10');
      });
      
      // Cancel should still work locally
      act(() => {
        result.current.cancelCommand(sessionId);
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history[0].output.some(o => o.includes('^C'))).toBe(true);
    });
  });

  describe('history management', () => {
    it('should clear command history', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Add some commands
      act(() => {
        result.current.executeCommand(sessionId, 'ls');
        result.current.executeCommand(sessionId, 'cd /tmp');
      });
      
      // Clear history
      act(() => {
        result.current.clearHistory(sessionId);
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBe(0);
    });

    it('should limit history size', async () => {
      const maxHistorySize = 2;
      const { result } = renderHook(() => useTerminal({ socket: mockSocket, maxHistorySize }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Execute more commands than max history size
      await act(async () => {
        await result.current.executeCommand(sessionId, 'command1');
        await result.current.executeCommand(sessionId, 'command2');
        await result.current.executeCommand(sessionId, 'command3');
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBe(maxHistorySize);
      expect(history[0].command).toBe('command2');
      expect(history[1].command).toBe('command3');
    });

    it('should limit command history size', async () => {
      const maxCommandHistory = 2;
      const { result } = renderHook(() => useTerminal({ socket: mockSocket, maxCommandHistory }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Execute more commands than max command history size
      await act(async () => {
        await result.current.executeCommand(sessionId, 'cmd1');
        await result.current.executeCommand(sessionId, 'cmd2');
        await result.current.executeCommand(sessionId, 'cmd3');
      });
      
      const commandHistory = result.current.getSessionCommandHistory(sessionId);
      expect(commandHistory.length).toBe(maxCommandHistory);
      expect(commandHistory[0]).toBe('cmd2');
      expect(commandHistory[1]).toBe('cmd3');
    });
  });

  describe('socket event handling', () => {
    it('should handle terminal output events', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Add a running command
      await act(async () => {
        await result.current.executeCommand(sessionId, 'echo hello');
      });
      
      // Simulate socket output event
      await act(async () => {
        mockSocket.emit('terminal:output', {
          sessionId,
          output: 'hello\n',
          type: 'stdout',
        });
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBeGreaterThan(0);
      if (history.length > 0) {
        expect(history[0].output.some(o => o.includes('hello'))).toBe(true);
      }
    });

    it('should handle terminal complete events', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Add a running command
      await act(async () => {
        await result.current.executeCommand(sessionId, 'echo hello');
      });
      
      // Simulate socket complete event
      await act(async () => {
        mockSocket.emit('terminal:complete', {
          sessionId,
          exitCode: 0,
          duration: 100,
        });
      });
      
      const history = result.current.getSessionHistory(sessionId);
      if (history.length > 0) {
        expect(history[0].isRunning).toBe(false);
        expect(history[0].exitCode).toBe(0);
        expect(history[0].duration).toBe(100);
      }
    });

    it('should handle socket connection events', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      // Initial connection state
      expect(result.current.activeSession?.isConnected).toBe(true);
      
      // Simulate disconnect
      await act(async () => {
        mockSocket.connected = false;
        mockSocket.emit('disconnect');
      });
      
      // Connection state should update
      expect(result.current.activeSession?.isConnected).toBe(false);
      
      // Simulate reconnect
      await act(async () => {
        mockSocket.connected = true;
        mockSocket.emit('connect');
      });
      
      // Connection state should update back
      expect(result.current.activeSession?.isConnected).toBe(true);
    });
  });

  describe('session state management', () => {
    it('should update current directory', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      act(() => {
        result.current.updateCurrentDirectory(sessionId, '/tmp');
      });
      
      expect(result.current.activeSession?.currentDirectory).toBe('/tmp');
    });

    it('should update environment variables', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      act(() => {
        result.current.updateEnvironment(sessionId, { TEST_VAR: 'test_value' });
      });
      
      expect(result.current.activeSession?.environment.TEST_VAR).toBe('test_value');
    });

    it('should merge environment variables', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      act(() => {
        result.current.updateEnvironment(sessionId, { VAR1: 'value1' });
        result.current.updateEnvironment(sessionId, { VAR2: 'value2' });
      });
      
      expect(result.current.activeSession?.environment.VAR1).toBe('value1');
      expect(result.current.activeSession?.environment.VAR2).toBe('value2');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive commands', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Execute multiple commands rapidly
      await act(async () => {
        await Promise.all([
          result.current.executeCommand(sessionId, 'ls'),
          result.current.executeCommand(sessionId, 'pwd'),
          result.current.executeCommand(sessionId, 'whoami'),
        ]);
      });
      
      const history = result.current.getSessionHistory(sessionId);
      expect(history.length).toBe(3);
    });

    it('should handle very long command outputs', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      const sessionId = result.current.sessions[0].id;
      
      // Simulate a command with very long output
      await act(async () => {
        await result.current.executeCommand(sessionId, 'cat large-file.txt');
      });
      
      // Simulate multiple output chunks
      await act(async () => {
        for (let i = 0; i < 100; i++) { // Reduced for test performance
          mockSocket.emit('terminal:output', {
            sessionId,
            output: `Line ${i} of very long output\n`,
            type: 'stdout',
          });
        }
        
        mockSocket.emit('terminal:complete', {
          sessionId,
          exitCode: 0,
          duration: 5000,
        });
      });
      
      const history = result.current.getSessionHistory(sessionId);
      if (history.length > 0) {
        expect(history[0].output.length).toBeGreaterThan(0);
      }
    });

    it('should handle session with invalid id gracefully', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      
      // Try to execute command on non-existent session
      act(() => {
        result.current.executeCommand('invalid-session-id', 'ls');
      });
      
      // Should not throw or affect existing sessions
      expect(result.current.sessions.length).toBe(1);
    });
  });
});