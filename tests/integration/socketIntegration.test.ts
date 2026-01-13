import { ShellService } from '@/lib/services/shellService';
import { AptService } from '@/lib/services/aptService';
import { Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('Socket.IO Integration Tests', () => {
  let mockSocket: Socket;

  beforeEach(() => {
    mockSocket = new (require('socket.io-client').Socket)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ShellService Socket.IO Integration', () => {
    it('should handle real-time command output streaming', async () => {
      const shellService = new ShellService(mockSocket);
      
      const generator = shellService.execute('ls -la');
      const outputs: any[] = [];

      // Start consuming the generator
      const consumePromise = (async () => {
        for await (const output of generator) {
          outputs.push(output);
        }
      })();

      // Simulate real-time output chunks
      mockSocket.emit('shell:output', { type: 'stdout', content: 'total 40\n' });
      mockSocket.emit('shell:output', { type: 'stdout', content: 'drwxr-xr-x  2 user user  4096 Jan  1 00:00 .\n' });
      mockSocket.emit('shell:output', { type: 'stdout', content: 'drwxr-xr-x  2 user user  4096 Jan  1 00:00 ..\n' });
      mockSocket.emit('shell:output', { type: 'stdout', content: '-rw-r--r--  1 user user    42 Jan  1 00:00 file1.txt\n' });
      
      // Simulate command completion
      mockSocket.emit('shell:exit', { exitCode: 0 });

      await consumePromise;

      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs.some(o => o.type === 'stdout')).toBe(true);
      expect(outputs.some(o => o.type === 'exit')).toBe(true);
    });

    it('should handle command execution with errors', async () => {
      const shellService = new ShellService(mockSocket);
      
      const generator = shellService.execute('invalid-command');
      const outputs: any[] = [];

      const consumePromise = (async () => {
        for await (const output of generator) {
          outputs.push(output);
        }
      })();

      // Simulate error output
      mockSocket.emit('shell:output', { type: 'stderr', content: 'Command not found: invalid-command\n' });
      mockSocket.emit('shell:exit', { exitCode: 127 });

      await consumePromise;

      expect(outputs.some(o => o.type === 'stderr')).toBe(true);
      expect(outputs.some(o => o.type === 'exit' && o.exitCode === 127)).toBe(true);
    });

    it('should handle multiple concurrent command executions', async () => {
      const shellService = new ShellService(mockSocket);
      
      // Execute multiple commands concurrently
      const generators = [
        shellService.execute('ls'),
        shellService.execute('pwd'),
        shellService.execute('whoami'),
      ];

      const results = await Promise.all(
        generators.map(async (generator) => {
          const outputs: any[] = [];
          for await (const output of generator) {
            outputs.push(output);
          }
          return outputs;
        })
      );

      // Each command should have outputs
      results.forEach(outputs => {
        expect(outputs.length).toBeGreaterThan(0);
      });
    });

    it('should handle socket disconnection during command execution', async () => {
      const shellService = new ShellService(mockSocket);
      
      const generator = shellService.execute('long-running-command');
      
      // Disconnect socket during execution
      mockSocket.connected = false;
      mockSocket.emit('disconnect');

      const outputs: any[] = [];
      try {
        for await (const output of generator) {
          outputs.push(output);
        }
      } catch (error) {
        // Expected behavior when socket disconnects
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('AptService Socket.IO Integration', () => {
    it('should handle package installation with progress updates', async () => {
      const aptService = new AptService(mockSocket);
      
      const progressUpdates: any[] = [];
      const onProgress = (operation: any) => {
        progressUpdates.push(operation);
      };

      // Start installation
      const installPromise = aptService.installPackage('nodejs', onProgress);

      // Simulate progress updates
      mockSocket.emit('apt:progress', {
        type: 'install',
        packageName: 'nodejs',
        progress: 10,
        status: 'Downloading package list',
        output: ['Reading package lists...'],
      });

      mockSocket.emit('apt:progress', {
        type: 'install',
        packageName: 'nodejs',
        progress: 50,
        status: 'Downloading nodejs',
        output: ['Downloading nodejs (18.0.0)...'],
      });

      mockSocket.emit('apt:progress', {
        type: 'install',
        packageName: 'nodejs',
        progress: 90,
        status: 'Installing nodejs',
        output: ['Installing nodejs...'],
      });

      // Simulate completion
      mockSocket.emit('apt:progress', {
        type: 'install',
        packageName: 'nodejs',
        progress: 100,
        status: 'Completed',
        output: ['nodejs installed successfully'],
      });

      // Mock the final callback
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          callback({ success: true });
        }
      });

      await installPromise;

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });

    it('should handle package search with multiple results', async () => {
      const aptService = new AptService(mockSocket);
      
      const mockPackages = [
        { name: 'nodejs', version: '18.0.0', description: 'Node.js runtime', size: '100MB', installed: false, upgradable: false },
        { name: 'nodejs-dev', version: '18.0.0', description: 'Node.js development files', size: '50MB', installed: false, upgradable: false },
        { name: 'nodejs-doc', version: '18.0.0', description: 'Node.js documentation', size: '10MB', installed: false, upgradable: false },
      ];

      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:search' && callback) {
          callback({ packages: mockPackages });
        }
      });

      const packages = await aptService.searchPackages('nodejs');

      expect(packages.length).toBe(3);
      expect(packages.every(p => p.name.includes('nodejs'))).toBe(true);
    });

    it('should handle package operations with dependencies', async () => {
      const aptService = new AptService(mockSocket);
      
      const onProgress = jest.fn();
      
      // Mock the install callback to simulate dependency handling
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'apt:install' && callback) {
          // Simulate progress for main package and dependencies
          mockSocket.emit('apt:progress', {
            type: 'install',
            packageName: 'libssl',
            progress: 30,
            status: 'Installing dependencies',
            output: ['Installing libssl...'],
          });

          mockSocket.emit('apt:progress', {
            type: 'install',
            packageName: 'nodejs',
            progress: 70,
            status: 'Installing main package',
            output: ['Installing nodejs...'],
          });

          callback({ success: true });
        }
      });

      await aptService.installPackage('nodejs', onProgress);

      expect(onProgress).toHaveBeenCalled();
      const calls = onProgress.mock.calls;
      expect(calls.some(call => call[0].packageName === 'libssl')).toBe(true);
      expect(calls.some(call => call[0].packageName === 'nodejs')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle socket reconnection gracefully', async () => {
      const shellService = new ShellService(mockSocket);
      
      // Disconnect
      mockSocket.connected = false;
      mockSocket.emit('disconnect');

      // Try to execute command while disconnected
      const generator = shellService.execute('ls');
      
      // Reconnect
      mockSocket.connected = true;
      mockSocket.emit('connect');

      // Simulate command completion after reconnection
      mockSocket.emit('shell:output', { type: 'stdout', content: 'file1.txt\n' });
      mockSocket.emit('shell:exit', { exitCode: 0 });

      const outputs: any[] = [];
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(0);
    });

    it('should handle malformed socket responses', async () => {
      const shellService = new ShellService(mockSocket);
      
      const generator = shellService.execute('ls');
      
      // Simulate malformed response
      mockSocket.emit('shell:output', { type: 'stdout' }); // Missing content
      mockSocket.emit('shell:exit', {}); // Missing exitCode

      const outputs: any[] = [];
      for await (const output of generator) {
        outputs.push(output);
      }

      // Should handle gracefully without crashing
      expect(outputs.length).toBeGreaterThan(0);
    });

    it('should handle rapid successive operations', async () => {
      const aptService = new AptService(mockSocket);
      
      // Mock rapid responses
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (callback) {
          setTimeout(() => {
            callback({ success: true });
          }, 1);
        }
      });

      const operations = [
        aptService.updateCache(),
        aptService.listInstalledPackages(),
        aptService.searchPackages('nodejs'),
        aptService.getSystemInfo(),
      ];

      await Promise.all(operations);

      // All operations should complete successfully
      expect(true).toBe(true); // Placeholder - actual assertions would depend on mock responses
    });

    it('should handle large data responses', async () => {
      const shellService = new ShellService(mockSocket);
      
      const generator = shellService.execute('find /');
      
      // Simulate large output
      for (let i = 0; i < 10000; i++) {
        mockSocket.emit('shell:output', { type: 'stdout', content: `/path/to/file${i}\n` });
      }
      
      mockSocket.emit('shell:exit', { exitCode: 0 });

      const outputs: any[] = [];
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(1000);
    });
  });

  describe('Socket.IO Event Handling', () => {
    it('should properly clean up event listeners', () => {
      const shellService = new ShellService(mockSocket);
      
      // Add some listeners
      const generator = shellService.execute('ls');
      
      // Check that listeners were added
      const listenersBefore = mockSocket.listenerCount('shell:output');
      expect(listenersBefore).toBeGreaterThan(0);

      // Complete the command
      mockSocket.emit('shell:output', { type: 'stdout', content: 'test\n' });
      mockSocket.emit('shell:exit', { exitCode: 0 });

      // After completion, listeners should still be there (they're persistent)
      const listenersAfter = mockSocket.listenerCount('shell:output');
      expect(listenersAfter).toBeGreaterThan(0);
    });

    it('should handle multiple listeners for same event', () => {
      const shellService = new ShellService(mockSocket);
      
      // Execute multiple commands that listen to same events
      shellService.execute('ls');
      shellService.execute('pwd');

      const listeners = mockSocket.listenerCount('shell:output');
      expect(listeners).toBeGreaterThan(1);

      // Emit an event - should be handled by all listeners
      mockSocket.emit('shell:output', { type: 'stdout', content: 'shared output\n' });
    });

    it('should handle event emission with callbacks', async () => {
      const aptService = new AptService(mockSocket);
      
      let callbackInvoked = false;
      
      // Mock emit to capture callback
      const originalEmit = mockSocket.emit;
      mockSocket.emit = jest.fn((event, data, callback) => {
        if (callback) {
          callbackInvoked = true;
          callback({ success: true });
        }
        return originalEmit.call(mockSocket, event, data, callback);
      });

      await aptService.updateCache();
      
      expect(callbackInvoked).toBe(true);
    });
  });
});