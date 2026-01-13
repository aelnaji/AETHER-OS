import { renderHook, act, waitFor } from '@testing-library/react';
import { useTerminal } from '@/lib/hooks/useTerminal';
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';
import {
  createMockTerminalCommand,
  createMockTerminalSession,
  buildTerminalHistory,
  waitFor as testWaitFor,
  setupTestEnvironment,
  measureExecutionTime,
} from '@/tests/utils/test-helpers';

describe('useTerminal', () => {
  let mockSocket: MockSocket;
  let testEnv: any;

  beforeEach(() => {
    mockSocket = createMockSocket();
    testEnv = setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with default session when no socket provided', () => {
      const { result } = renderHook(() => useTerminal());

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.activeSessionId).toBe(result.current.sessions[0].id);
      expect(result.current.activeSession?.title).toBe('Terminal 1');
      expect(result.current.activeSession?.isActive).toBe(true);
      expect(result.current.activeSession?.isConnected).toBe(false);
    });

    it('should initialize with connected status when socket is connected', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      expect(result.current.activeSession?.isConnected).toBe(true);
    });

    it('should initialize with disconnected status when socket is disconnected', () => {
      mockSocket.connected = false;
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      expect(result.current.activeSession?.isConnected).toBe(false);
    });

    it('should use custom history size limits', () => {
      const { result } = renderHook(() => useTerminal({
        socket: mockSocket,
        maxHistorySize: 50,
        maxCommandHistory: 25
      }));

      // Should initialize normally
      expect(result.current.sessions).toHaveLength(1);
    });
  });

  describe('session management', () => {
    it('should create new session with default title', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.addSession();
      });

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.activeSessionId).toBe(result.current.sessions[1].id);
      expect(result.current.activeSession?.title).toBe('Terminal 2');
    });

    it('should create new session with custom title', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.addSession('Custom Terminal');
      });

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.activeSession?.title).toBe('Custom Terminal');
    });

    it('should close session and switch to another', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.addSession('Terminal 2');
        result.current.addSession('Terminal 3');
      });

      expect(result.current.sessions).toHaveLength(3);

      // Close the active session (Terminal 3)
      const activeSessionId = result.current.activeSessionId;
      act(() => {
        result.current.closeSession(activeSessionId);
      });

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.activeSession?.title).toBe('Terminal 2');
    });

    it('should keep at least one session open', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.closeSession(result.current.activeSessionId);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.activeSession?.title).toBe('Terminal 1');
    });

    it('should close middle session and maintain others', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.addSession('Terminal 2');
        result.current.addSession('Terminal 3');
      });

      expect(result.current.sessions).toHaveLength(3);

      // Close middle session
      const middleSessionId = result.current.sessions[1].id;
      act(() => {
        result.current.closeSession(middleSessionId);
      });

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.sessions[0].title).toBe('Terminal 1');
      expect(result.current.sessions[1].title).toBe('Terminal 3');
      expect(result.current.activeSessionId).toBe(result.current.sessions[0].id);
    });

    it('should rename session', () => {
      const { result } = renderHook(() => useTerminal());
      const sessionId = result.current.activeSessionId;

      act(() => {
        result.current.renameSession(sessionId, 'New Name');
      });

      expect(result.current.sessions[0].title).toBe('New Name');
    });

    it('should switch to different session', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.addSession('Terminal 2');
      });

      const newSessionId = result.current.sessions[1].id;

      act(() => {
        result.current.switchSession(newSessionId);
      });

      expect(result.current.activeSessionId).toBe(newSessionId);
      expect(result.current.sessions[1].isActive).toBe(true);
      expect(result.current.sessions[0].isActive).toBe(false);
    });

    it('should get active session', () => {
      const { result } = renderHook(() => useTerminal());

      const activeSession = result.current.activeSession;

      expect(activeSession).toBeDefined();
      expect(activeSession?.isActive).toBe(true);
      expect(activeSession?.id).toBe(result.current.activeSessionId);
    });
  });

  describe('command execution', () => {
    it('should execute command in active session', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'echo "test"');
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history).toHaveLength(1);
        expect(activeSession?.history[0].command).toBe('echo "test"');
        expect(activeSession?.history[0].isRunning).toBe(true);
      });

      // Simulate command completion
      mockSocket.emit('terminal:complete', {
        sessionId: result.current.activeSessionId,
        exitCode: 0,
        duration: 100
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history[0].isRunning).toBe(false);
        expect(activeSession?.history[0].exitCode).toBe(0);
      });
    });

    it('should not execute empty commands', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, '   ');
      });

      const activeSession = result.current.activeSession;
      expect(activeSession?.history).toHaveLength(0);
    });

    it('should add command to history', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'ls -la');
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.commandHistory).toContain('ls -la');
      });
    });

    it('should limit command history size', async () => {
      const { result } = renderHook(() => useTerminal({
        socket: mockSocket,
        maxCommandHistory: 3
      }));

      const commands = ['cmd1', 'cmd2', 'cmd3', 'cmd4', 'cmd5'];

      for (const cmd of commands) {
        act(() => {
          result.current.executeCommand(result.current.activeSessionId, cmd);
        });
      }

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.commandHistory).toHaveLength(3);
        expect(activeSession?.commandHistory).toEqual(['cmd3', 'cmd4', 'cmd5']);
      });
    });

    it('should limit history size', async () => {
      const { result } = renderHook(() => useTerminal({
        socket: mockSocket,
        maxHistorySize: 3
      }));

      const commands = ['cmd1', 'cmd2', 'cmd3', 'cmd4', 'cmd5'];

      for (const cmd of commands) {
        act(() => {
          result.current.executeCommand(result.current.activeSessionId, cmd);
        });
      }

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history).toHaveLength(3);
      });
    });

    it('should handle command execution when not connected', () => {
      mockSocket.connected = false;
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'echo "test"');
      });

      const activeSession = result.current.activeSession;
      expect(activeSession?.history).toHaveLength(1);
      expect(activeSession?.history[0].output).toContain('Not connected to backend');
      expect(activeSession?.history[0].exitCode).toBe(127);
    });

    it('should handle socket errors during execution', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      mockSocket.emit = jest.fn().mockImplementation(() => {
        throw new Error('Socket error');
      });

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'echo "test"');
      });

      const activeSession = result.current.activeSession;
      expect(activeSession?.history).toHaveLength(1);
      expect(activeSession?.history[0].exitCode).toBe(1);
    });
  });

  describe('command cancellation', () => {
    it('should cancel running command', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'long-running-command');
      });

      act(() => {
        result.current.cancelCommand(result.current.activeSessionId);
      });

      const activeSession = result.current.activeSession;
      expect(activeSession?.history[0].output).toContain('^C');
      expect(activeSession?.history[0].isRunning).toBe(false);
      expect(activeSession?.history[0].exitCode).toBe(130);
    });

    it('should emit cancel event to socket', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.cancelCommand(result.current.activeSessionId);
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('terminal:cancel', {
        sessionId: result.current.activeSessionId
      });
    });

    it('should handle cancellation when not connected', () => {
      mockSocket.connected = false;
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.cancelCommand(result.current.activeSessionId);
      });

      // Should not throw error
      expect(mockSocket.emit).not.toHaveBeenCalledWith('terminal:cancel');
    });
  });

  describe('history navigation', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Add some commands to history
      const commands = ['ls -la', 'pwd', 'echo "test"', 'whoami', 'date'];
      for (const cmd of commands) {
        act(() => {
          result.current.executeCommand(result.current.activeSessionId, cmd);
        });
      }

      // Wait for all commands to be processed
      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.commandHistory).toHaveLength(5);
      });
    });

    it('should navigate up in history', () => {
      const { result } = renderHook(() => useTerminal());

      const command1 = result.current.navigateHistory(result.current.activeSessionId, 'up');
      expect(command1).toBe('date'); // Last command

      const command2 = result.current.navigateHistory(result.current.activeSessionId, 'up');
      expect(command2).toBe('whoami');

      const command3 = result.current.navigateHistory(result.current.activeSessionId, 'up');
      expect(command3).toBe('echo "test"');
    });

    it('should navigate down in history', () => {
      const { result } = renderHook(() => useTerminal());

      // Start at the end
      result.current.navigateHistory(result.current.activeSessionId, 'up');
      result.current.navigateHistory(result.current.activeSessionId, 'up');

      // Navigate down
      const command = result.current.navigateHistory(result.current.activeSessionId, 'down');
      expect(command).toBe('whoami');

      const nextCommand = result.current.navigateHistory(result.current.activeSessionId, 'down');
      expect(nextCommand).toBe('date');
    });

    it('should return empty string when navigating down from end', () => {
      const { result } = renderHook(() => useTerminal());

      const command = result.current.navigateHistory(result.current.activeSessionId, 'down');
      expect(command).toBe('');
    });

    it('should reset history index when executing new command', () => {
      const { result } = renderHook(() => useTerminal());

      // Navigate to history
      result.current.navigateHistory(result.current.activeSessionId, 'up');
      expect(result.current.activeSession?.historyIndex).toBe(4);

      // Execute new command
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'new command');
      });

      expect(result.current.activeSession?.historyIndex).toBe(-1);
    });

    it('should handle empty history', () => {
      const { result } = renderHook(() => useTerminal());

      const command = result.current.navigateHistory(result.current.activeSessionId, 'up');
      expect(command).toBeNull();
    });

    it('should handle history navigation in empty session', () => {
      const { result } = renderHook(() => useTerminal());
      const nonExistentSessionId = 'non-existent';

      const command = result.current.navigateHistory(nonExistentSessionId, 'up');
      expect(command).toBeNull();
    });
  });

  describe('session history management', () => {
    it('should clear session history', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Add a command
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'ls -la');
      });

      expect(result.current.activeSession?.history).toHaveLength(1);

      // Clear history
      act(() => {
        result.current.clearHistory(result.current.activeSessionId);
      });

      expect(result.current.activeSession?.history).toHaveLength(0);
    });

    it('should get session history', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Add commands
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'ls -la');
        result.current.executeCommand(result.current.activeSessionId, 'pwd');
      });

      const history = result.current.getSessionHistory(result.current.activeSessionId);
      expect(history).toHaveLength(2);
      expect(history[0].command).toBe('ls -la');
      expect(history[1].command).toBe('pwd');
    });

    it('should get session command history', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Add commands
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'ls -la');
        result.current.executeCommand(result.current.activeSessionId, 'pwd');
      });

      const commandHistory = result.current.getSessionCommandHistory(result.current.activeSessionId);
      expect(commandHistory).toEqual(['ls -la', 'pwd']);
    });
  });

  describe('directory and environment management', () => {
    it('should update current directory', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.updateCurrentDirectory(result.current.activeSessionId, '/home/user/documents');
      });

      expect(result.current.activeSession?.currentDirectory).toBe('/home/user/documents');
    });

    it('should update environment variables', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      const newEnv = { PATH: '/custom/path', DEBUG: 'true' };

      act(() => {
        result.current.updateEnvironment(result.current.activeSessionId, newEnv);
      });

      expect(result.current.activeSession?.environment).toMatchObject(newEnv);
    });

    it('should merge environment variables', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Set initial environment
      act(() => {
        result.current.updateEnvironment(result.current.activeSessionId, { VAR1: 'value1' });
      });

      // Update with more variables
      act(() => {
        result.current.updateEnvironment(result.current.activeSessionId, { VAR2: 'value2' });
      });

      expect(result.current.activeSession?.environment).toEqual({
        VAR1: 'value1',
        VAR2: 'value2'
      });
    });
  });

  describe('socket event handling', () => {
    it('should handle terminal output events', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Execute command to create session
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'echo "test"');
      });

      // Simulate output event
      mockSocket.emit('terminal:output', {
        sessionId: result.current.activeSessionId,
        output: 'test output',
        type: 'stdout'
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history[0].output).toContain('test output');
      });
    });

    it('should handle terminal complete events', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Execute command
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'ls');
      });

      // Simulate completion
      mockSocket.emit('terminal:complete', {
        sessionId: result.current.activeSessionId,
        exitCode: 0,
        duration: 150
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history[0].isRunning).toBe(false);
        expect(activeSession?.history[0].exitCode).toBe(0);
        expect(activeSession?.history[0].duration).toBe(150);
      });
    });

    it('should handle connect/disconnect events', () => {
      mockSocket.connected = false;
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      expect(result.current.activeSession?.isConnected).toBe(false);

      // Simulate connection
      act(() => {
        mockSocket.emit('connect');
      });

      expect(result.current.activeSession?.isConnected).toBe(true);

      // Simulate disconnection
      act(() => {
        mockSocket.emit('disconnect');
      });

      expect(result.current.activeSession?.isConnected).toBe(false);
    });

    it('should only update the correct session', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Create second session
      let session2Id: string;
      act(() => {
        session2Id = result.current.addSession('Session 2');
      });

      // Execute command in session 1
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'cmd1');
      });

      // Switch to session 2
      act(() => {
        result.current.switchSession(session2Id!);
      });

      // Execute command in session 2
      act(() => {
        result.current.executeCommand(session2Id!, 'cmd2');
      });

      // Simulate output for session 1
      mockSocket.emit('terminal:output', {
        sessionId: result.current.activeSessionId,
        output: 'output1',
        type: 'stdout'
      });

      await waitFor(() => {
        const session1 = result.current.sessions.find(s => s.id !== session2Id);
        const session2 = result.current.sessions.find(s => s.id === session2Id);
        
        expect(session1?.history[0].output).toContain('output1');
        expect(session2?.history[0].output).not.toContain('output1');
      });
    });
  });

  describe('real-time streaming', () => {
    it('should handle multiple output chunks', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'long-output-command');
      });

      // Simulate multiple output chunks
      mockSocket.emit('terminal:output', {
        sessionId: result.current.activeSessionId,
        output: 'First chunk\n',
        type: 'stdout'
      });

      mockSocket.emit('terminal:output', {
        sessionId: result.current.activeSessionId,
        output: 'Second chunk\n',
        type: 'stdout'
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history[0].output).toHaveLength(2);
        expect(activeSession?.history[0].output[0]).toContain('First chunk');
        expect(activeSession?.history[0].output[1]).toContain('Second chunk');
      });
    });

    it('should handle stderr output', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'error-command');
      });

      mockSocket.emit('terminal:output', {
        sessionId: result.current.activeSessionId,
        output: 'Error message',
        type: 'stderr'
      });

      await waitFor(() => {
        const activeSession = result.current.activeSession;
        expect(activeSession?.history[0].output).toContain('Error message');
      });
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple sessions executing commands simultaneously', async () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Create additional sessions
      act(() => {
        result.current.addSession('Session 2');
      });
      act(() => {
        result.current.addSession('Session 3');
      });

      const sessionIds = result.current.sessions.map(s => s.id);

      // Execute commands in all sessions
      sessionIds.forEach((sessionId, index) => {
        act(() => {
          result.current.executeCommand(sessionId, `echo "Session ${index + 1}"`);
        });
      });

      // Verify all sessions have the command
      await waitFor(() => {
        result.current.sessions.forEach((session, index) => {
          expect(session.history).toHaveLength(1);
          expect(session.history[0].command).toBe(`echo "Session ${index + 1}"`);
        });
      });
    });

    it('should handle rapid session creation and deletion', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Create and close multiple sessions rapidly
      for (let i = 0; i < 5; i++) {
        act(() => {
          const newSessionId = result.current.addSession(`Session ${i + 2}`);
          result.current.closeSession(newSessionId);
        });
      }

      // Should still have at least the default session
      expect(result.current.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should handle large command history efficiently', async () => {
      const { result } = renderHook(() => useTerminal({
        socket: mockSocket,
        maxCommandHistory: 1000
      }));

      const start = performance.now();

      // Add many commands
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.executeCommand(result.current.activeSessionId, `command ${i}`);
        });
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.current.activeSession?.commandHistory).toHaveLength(100);
    });

    it('should handle session switching efficiently', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Create many sessions
      const sessionIds: string[] = [];
      for (let i = 0; i < 20; i++) {
        act(() => {
          const sessionId = result.current.addSession(`Session ${i + 2}`);
          sessionIds.push(sessionId);
        });
      }

      const start = performance.now();

      // Switch between sessions rapidly
      for (let i = 0; i < 100; i++) {
        const sessionId = sessionIds[i % sessionIds.length];
        act(() => {
          result.current.switchSession(sessionId);
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent session operations', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      const nonExistentSessionId = 'non-existent-id';

      // Should not throw errors
      expect(() => {
        result.current.executeCommand(nonExistentSessionId, 'cmd');
        result.current.closeSession(nonExistentSessionId);
        result.current.renameSession(nonExistentSessionId, 'New Name');
        result.current.cancelCommand(nonExistentSessionId);
        result.current.clearHistory(nonExistentSessionId);
      }).not.toThrow();
    });

    it('should handle very long command strings', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      const longCommand = 'echo "' + 'x'.repeat(10000) + '"';

      expect(() => {
        act(() => {
          result.current.executeCommand(result.current.activeSessionId, longCommand);
        });
      }).not.toThrow();

      expect(result.current.activeSession?.history[0].command).toBe(longCommand);
    });

    it('should handle commands with special characters', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));
      const specialCommands = [
        'echo "test with \'quotes\'"',
        'echo "test with $HOME"',
        'echo "test with `backticks`"',
        'echo "test with \\n \\t"',
        'find . -name "*.txt" -exec echo {} \\;'
      ];

      specialCommands.forEach(cmd => {
        expect(() => {
          act(() => {
            result.current.executeCommand(result.current.activeSessionId, cmd);
          });
        }).not.toThrow();
      });
    });

    it('should handle empty session title updates', () => {
      const { result } = renderHook(() => useTerminal());

      act(() => {
        result.current.renameSession(result.current.activeSessionId, '');
      });

      expect(result.current.activeSession?.title).toBe('');
    });
  });

  describe('memory management', () => {
    it('should properly clean up when component unmounts', () => {
      const { unmount } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Add some data
      act(() => {
        result.current.executeCommand(result.current.activeSessionId, 'test');
      });

      // Unmount
      unmount();

      // Socket listeners should be cleaned up
      expect(mockSocket.off).toHaveBeenCalled();
    });

    it('should handle session data cleanup on close', () => {
      const { result } = renderHook(() => useTerminal({ socket: mockSocket }));

      // Create session with data
      act(() => {
        const sessionId = result.current.addSession('Test Session');
        result.current.executeCommand(sessionId, 'test command');
        result.current.updateCurrentDirectory(sessionId, '/test/path');
      });

      const testSessionId = result.current.sessions[1].id;

      // Close session
      act(() => {
        result.current.closeSession(testSessionId);
      });

      // Session should be removed
      expect(result.current.sessions.find(s => s.id === testSessionId)).toBeUndefined();
    });
  });
});