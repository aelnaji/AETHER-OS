import { ShellService } from '@/lib/services/shellService';
import { AptService } from '@/lib/services/aptService';
import { MockSocket, createMockSocket, createSocketWithCustomResponses } from '@/tests/utils/mocks';
import { waitFor, measureExecutionTime } from '@/tests/utils/test-helpers';

describe('Socket.IO Integration Tests', () => {
  let mockSocket: MockSocket;
  let shellService: ShellService;
  let aptService: AptService;

  beforeEach(() => {
    mockSocket = createMockSocket();
    shellService = new ShellService(mockSocket);
    aptService = new AptService(mockSocket);
  });

  describe('Socket Connection Management', () => {
    it('should handle socket connection lifecycle', () => {
      const connectHandler = jest.fn();
      const disconnectHandler = jest.fn();
      
      mockSocket.on('connect', connectHandler);
      mockSocket.on('disconnect', disconnectHandler);

      // Simulate connection
      mockSocket.emit('connect');
      expect(connectHandler).toHaveBeenCalled();

      // Simulate disconnection
      mockSocket.emit('disconnect');
      expect(disconnectHandler).toHaveBeenCalled();
    });

    it('should handle socket reconnection', async () => {
      // Start disconnected
      mockSocket.connected = false;
      
      let connectionAttempts = 0;
      const reconnectHandler = jest.fn(() => {
        connectionAttempts++;
        if (connectionAttempts === 1) {
          mockSocket.connected = true;
          mockSocket.emit('connect');
        }
      });

      mockSocket.on('reconnect', reconnectHandler);

      // Simulate reconnection
      await waitFor(50);
      expect(reconnectHandler).toHaveBeenCalled();
      expect(mockSocket.connected).toBe(true);
    });

    it('should handle multiple concurrent socket operations', async () => {
      const promises = [
        shellService.getAvailableCommands(),
        shellService.getCurrentDirectory(),
        aptService.getSystemInfo(),
        aptService.listInstalledPackages()
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBeInstanceOf(Array);
      expect(typeof results[1]).toBe('string');
      expect(results[2]).toHaveProperty('totalPackages');
      expect(results[3]).toBeInstanceOf(Array);
    });
  });

  describe('Shell Service Integration', () => {
    it('should handle complete command execution workflow', async () => {
      const command = 'ls -la /home';
      
      const start = performance.now();
      const generator = shellService.execute(command);
      const outputs = [];

      for await (const output of generator) {
        outputs.push(output);
      }
      const duration = performance.now() - start;

      expect(outputs).toHaveLength(2); // stdout + exit
      expect(outputs[0].type).toBe('stdout');
      expect(outputs[1].type).toBe('exit');
      expect(outputs[1].exitCode).toBe(0);
      expect(duration).toBeLessThan(500); // Should complete quickly
    });

    it('should handle process management workflow', async () => {
      // Get processes
      const processes = await shellService.getRunningProcesses();
      expect(processes.length).toBeGreaterThan(0);

      // Kill first process
      const firstProcess = processes[0];
      await shellService.killProcess(firstProcess.pid);

      // Verify kill operation
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:kill', {
        pid: firstProcess.pid,
        signal: 'SIGTERM'
      }, expect.any(Function));
    });

    it('should handle environment variable operations', async () => {
      // Get current environment
      const env = await shellService.getEnvironmentVariables();
      expect(env).toHaveProperty('PATH');

      // Set new environment variable
      await shellService.setEnvironmentVariable('TEST_VAR', 'test_value');

      // Verify set operation
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:set-env', {
        key: 'TEST_VAR',
        value: 'test_value'
      }, expect.any(Function));
    });

    it('should handle file system operations', async () => {
      // List files
      const files = await shellService.listFiles('/home');
      expect(files).toBeInstanceOf(Array);

      // Test autocomplete
      const suggestions = await shellService.autocomplete('ls', 2);
      expect(suggestions).toContain('ls');
    });

    it('should handle command help system', async () => {
      // Get help for command
      const help = await shellService.getCommandHelp('ls');
      expect(help).toBe('Mock help for ls');

      // Verify help request
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:help', {
        command: 'ls'
      }, expect.any(Function));
    });
  });

  describe('APT Service Integration', () => {
    it('should handle complete package management workflow', async () => {
      // Search for packages
      const searchResults = await aptService.searchPackages('nginx');
      expect(searchResults.length).toBeGreaterThan(0);

      // Get package info
      const packageInfo = await aptService.getPackageInfo('nginx');
      expect(packageInfo.name).toBe('nginx');

      // Get system info
      const systemInfo = await aptService.getSystemInfo();
      expect(systemInfo).toHaveProperty('totalPackages');
    });

    it('should handle package installation with progress tracking', async () => {
      const progressUpdates: any[] = [];
      const onProgress = (operation: any) => {
        progressUpdates.push(operation);
      };

      // Start installation
      const installPromise = aptService.installPackage('test-package', onProgress);
      
      // Wait for completion
      await installPromise;

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toHaveProperty('type', 'install');
      expect(progressUpdates[0]).toHaveProperty('progress');
    });

    it('should handle multiple package operations concurrently', async () => {
      const installPromise = aptService.installPackage('package1');
      const removePromise = aptService.removePackage('package2');
      const searchPromise = aptService.searchPackages('lib');

      const [installResult, removeResult, searchResults] = await Promise.all([
        installPromise,
        removePromise,
        searchPromise
      ]);

      expect(installResult).toBeUndefined();
      expect(removeResult).toBeUndefined();
      expect(searchResults).toBeInstanceOf(Array);
    });

    it('should handle system maintenance operations', async () => {
      // Update cache
      await aptService.updateCache();
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:update', {}, expect.any(Function));

      // Clean cache
      await aptService.cleanCache();
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:clean', {}, expect.any(Function));

      // Autoremove
      await aptService.autoremove();
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:autoremove', {}, expect.any(Function));
    });

    it('should handle package upgrades', async () => {
      // List upgradable packages
      const upgradable = await aptService.listUpgradable();
      expect(upgradable).toBeInstanceOf(Array);

      // Upgrade specific package
      await aptService.updatePackage('npm');
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:update-package', {
        packageName: 'npm'
      }, expect.any(Function));

      // Upgrade all packages
      await aptService.upgradeAll();
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:upgrade', {}, expect.any(Function));
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const errorSocket = createSocketWithCustomResponses({
        'shell:execute': Promise.reject(new Error('Network error')),
        'apt:install': Promise.reject(new Error('Connection failed'))
      });

      const errorShellService = new ShellService(errorSocket);
      const errorAptService = new AptService(errorSocket);

      // Shell service error
      const shellGenerator = errorShellService.execute('test-command');
      await expect(async () => {
        for await (const output of shellGenerator) {
          // Should handle error
        }
      }).not.toThrow();

      // APT service error
      await expect(errorAptService.installPackage('test-package')).rejects.toThrow('Connection failed');
    });

    it('should handle malformed responses', async () => {
      const malformedSocket = createSocketWithCustomResponses({
        'apt:info': null, // Malformed response
        'shell:ps': undefined // Malformed response
      });

      const malformedAptService = new AptService(malformedSocket);

      // Should handle null response gracefully
      await expect(malformedAptService.getPackageInfo('test')).rejects.toThrow();
    });

    it('should handle timeout scenarios', async () => {
      const timeoutSocket = createSocketWithCustomResponses({
        'shell:execute': new Promise(resolve => setTimeout(() => resolve({}), 10000))
      });

      const timeoutShellService = new ShellService(timeoutSocket);
      const start = performance.now();

      const generator = timeoutShellService.execute('long-command', { timeout: 100 });
      
      await expect(async () => {
        for await (const output of generator) {
          // Should timeout
        }
      }).rejects.toThrow('Command execution timeout');

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // Should timeout quickly
    });
  });

  describe('Event-Driven Communication', () => {
    it('should handle event emission and response handling', async () => {
      let responseReceived = false;
      
      mockSocket.emit('custom:event', { data: 'test' }, (response: any) => {
        responseReceived = true;
        expect(response).toBeDefined();
      });

      await waitFor(50);
      expect(responseReceived).toBe(true);
    });

    it('should handle progress event streams', async () => {
      const progressEvents: any[] = [];
      
      // Simulate progress events
      for (let i = 0; i <= 100; i += 25) {
        mockSocket.emit('apt:progress', {
          type: 'install',
          packageName: 'test-package',
          progress: i,
          status: `Progress: ${i}%`,
          output: [`Progress update: ${i}%`]
        });
      }

      await waitFor(100);

      // Events should be processed
      expect(progressEvents.length).toBeGreaterThan(0);
    });

    it('should handle bidirectional communication', async () => {
      const bidirectionalEvents: any[] = [];

      mockSocket.on('server:message', (data: any) => {
        bidirectionalEvents.push(data);
        
        // Respond to server message
        mockSocket.emit('client:response', { 
          originalMessage: data.message,
          response: 'Acknowledged'
        });
      });

      // Send server message
      mockSocket.emit('server:message', { 
        message: 'Hello from server',
        timestamp: Date.now() 
      });

      await waitFor(50);

      expect(bidirectionalEvents.length).toBe(1);
      expect(bidirectionalEvents[0].message).toBe('Hello from server');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high-frequency event emission', async () => {
      const eventCount = 100;
      const events: any[] = [];

      // Emit many events rapidly
      for (let i = 0; i < eventCount; i++) {
        mockSocket.emit('high:freq:event', { id: i, timestamp: Date.now() });
      }

      await waitFor(50);

      // Should handle all events without performance degradation
      expect(events.length).toBeGreaterThan(0);
    });

    it('should handle concurrent long-running operations', async () => {
      const longRunningOps = [
        shellService.execute('sleep 1'),
        shellService.execute('find / -name "*.log" 2>/dev/null | head -10'),
        aptService.updateCache(),
        aptService.upgradeAll()
      ];

      const start = performance.now();
      const results = await Promise.allSettled(longRunningOps);
      const duration = performance.now() - start;

      // Should handle concurrent operations efficiently
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(results.length).toBe(4);
    });

    it('should handle rapid socket state changes', async () => {
      const stateChanges: boolean[] = [];

      const handleConnect = () => {
        stateChanges.push(true);
        mockSocket.connected = true;
      };

      const handleDisconnect = () => {
        stateChanges.push(false);
        mockSocket.connected = false;
      };

      mockSocket.on('connect', handleConnect);
      mockSocket.on('disconnect', handleDisconnect);

      // Rapid state changes
      for (let i = 0; i < 5; i++) {
        mockSocket.emit('connect');
        await waitFor(10);
        mockSocket.emit('disconnect');
        await waitFor(10);
      }

      expect(stateChanges.length).toBe(10);
      expect(stateChanges[0]).toBe(true);
      expect(stateChanges[1]).toBe(false);
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Set environment variable
      await shellService.setEnvironmentVariable('INTEGRATION_TEST', 'value1');
      
      // Execute command that uses the environment variable
      const generator = shellService.execute('echo $INTEGRATION_TEST');
      const outputs = [];
      
      for await (const output of generator) {
        outputs.push(output);
      }

      // Should use the environment variable
      expect(outputs.length).toBe(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:execute', expect.objectContaining({
        environment: expect.objectContaining({
          INTEGRATION_TEST: 'value1'
        })
      }));
    });

    it('should handle complex workflow with state dependencies', async () => {
      // Change directory
      await shellService.changeDirectory('/tmp/test');
      
      // Execute command in that directory
      const generator = shellService.execute('pwd && ls -la');
      const outputs = [];
      
      for await (const output of generator) {
        outputs.push(output);
      }

      // Should include directory change context
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:execute', expect.objectContaining({
        cwd: '/tmp/test'
      }));
    });

    it('should handle cross-service data dependencies', async () => {
      // Get system info for package operations context
      const systemInfo = await aptService.getSystemInfo();
      
      // Install package based on system info
      await aptService.installPackage('system-aware-package');

      // Should consider system state
      expect(mockSocket.emit).toHaveBeenCalledWith('apt:install', expect.objectContaining({
        packageName: 'system-aware-package'
      }));
    });
  });

  describe('Socket.IO Protocol Compliance', () => {
    it('should handle acknowledgment patterns', async () => {
      let ackReceived = false;
      let ackData: any;

      mockSocket.emit('test:ack', { test: 'data' }, (response: any) => {
        ackReceived = true;
        ackData = response;
      });

      await waitFor(50);

      expect(ackReceived).toBe(true);
      expect(ackData).toBeDefined();
    });

    it('should handle broadcast patterns', async () => {
      const broadcastListeners: any[] = [];
      
      mockSocket.on('broadcast:message', (data: any) => {
        broadcastListeners.push(data);
      });

      // Simulate broadcast from server
      mockSocket.emit('broadcast:message', { 
        type: 'system_announcement',
        message: 'System maintenance in 5 minutes'
      });

      await waitFor(50);

      expect(broadcastListeners.length).toBe(1);
      expect(broadcastListeners[0].type).toBe('system_announcement');
    });

    it('should handle room/namespace communication', async () => {
      const roomMessages: any[] = [];
      
      mockSocket.on('room:terminal', (data: any) => {
        roomMessages.push(data);
      });

      // Simulate room-specific message
      mockSocket.emit('room:terminal', {
        sessionId: 'test-session',
        command: 'echo "room message"'
      });

      await waitFor(50);

      expect(roomMessages.length).toBe(1);
      expect(roomMessages[0].sessionId).toBe('test-session');
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle large data streams efficiently', async () => {
      const largeOutput = 'x'.repeat(10000);
      const outputChunks: string[] = [];

      // Simulate large output
      for (let i = 0; i < 100; i++) {
        mockSocket.emit('shell:output', {
          type: 'stdout',
          content: largeOutput
        });
      }

      await waitFor(100);

      // Should handle large data without memory issues
      expect(outputChunks.length).toBeGreaterThan(0);
    });

    it('should cleanup event listeners properly', () => {
      const eventHandler = jest.fn();
      const broadcastHandler = jest.fn();

      mockSocket.on('test:event', eventHandler);
      mockSocket.on('broadcast:event', broadcastHandler);

      // Remove specific listener
      mockSocket.off('test:event', eventHandler);
      
      // Emit events
      mockSocket.emit('test:event', { test: 'data' });
      mockSocket.emit('broadcast:event', { broadcast: 'data' });

      expect(eventHandler).not.toHaveBeenCalled();
      expect(broadcastHandler).toHaveBeenCalled();
    });

    it('should handle resource cleanup on disconnect', () => {
      const connectionHandlers = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        reconnect: jest.fn(),
        error: jest.fn()
      };

      Object.entries(connectionHandlers).forEach(([event, handler]) => {
        mockSocket.on(event, handler);
      });

      // Simulate disconnect
      mockSocket.emit('disconnect');

      expect(connectionHandlers.disconnect).toHaveBeenCalled();

      // Cleanup
      mockSocket.removeAllListeners();

      // Re-emit events
      mockSocket.emit('connect');
      mockSocket.emit('disconnect');

      expect(connectionHandlers.connect).toHaveBeenCalledTimes(1); // Only initial call
      expect(connectionHandlers.disconnect).toHaveBeenCalledTimes(1); // Only initial call
    });
  });
});