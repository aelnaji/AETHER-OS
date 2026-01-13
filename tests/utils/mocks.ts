import { Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

// Mock Socket.IO client for testing
export class MockSocket extends EventEmitter implements Partial<Socket> {
  public connected = true;
  public id = 'mock-socket-id';
  private emitCallbacks = new Map<string, Function[]>();

  constructor() {
    super();
    // Simulate connection
    setTimeout(() => this.emit('connect'), 10);
    
    // Spy on emit method for testing
    this.emit = jest.fn().mockImplementation((event: string, ...args: any[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        args.pop();
      }
      
      // Handle different events based on testing scenarios
      try {
        const response = this.handleEmitSync(event, ...args);
        if (typeof callback === 'function') {
          callback(response);
        }
      } catch (error) {
        if (typeof callback === 'function') {
          callback({ error: error.message });
        }
      }

      return this;
    });
  }

  // Mock socket.io-client interface methods
  connect() {
    this.connected = true;
    this.emit('connect');
    return this;
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect');
    return this;
  }

  on(event: string, callback: Function) {
    super.on(event, callback);
    return this;
  }

  off(event: string, callback?: Function) {
    super.off(event, callback);
    return this;
  }

  // Mock response handlers for different events
  private handleEmitSync(event: string, ...args: any[]): any {
    switch (event) {
      // Shell service events
      case 'shell:execute':
        // Process the command execution asynchronously after listeners are set up
        setTimeout(() => {
          const { command } = args[0];
          
          // Simulate different command types
          if (command.includes('error')) {
            // Emit stderr output first
            this.emit('shell:output', { type: 'stderr', content: 'Mock error: Command failed\n' });
            // Then emit exit
            this.emit('shell:exit', { exitCode: 1 });
          } else if (command.includes('sleep')) {
            // Just emit exit for sleep commands
            this.emit('shell:exit', { exitCode: 0 });
          } else {
            // Normal command execution - emit stdout then exit
            this.emit('shell:output', { type: 'stdout', content: `Mock output for: ${command}\n` });
            this.emit('shell:exit', { exitCode: 0 });
          }
        }, 20); // Small delay to ensure listeners are set up
        return { success: true };
      case 'shell:available-commands':
        return { commands: ['ls', 'cd', 'pwd', 'echo', 'cat', 'grep', 'find', 'mkdir', 'rm', 'cp', 'mv'] };
      case 'shell:help':
        return { help: 'Mock help for ' + args[0].command };
      case 'shell:env':
        return { env: { PATH: '/usr/bin:/bin', HOME: '/home/user', USER: 'testuser' } };
      case 'shell:set-env':
        return { success: true };
      case 'shell:pwd':
        return { cwd: '/home/test' };
      case 'shell:cd':
        return { success: !args[0].path.includes('error') };
      case 'shell:ps':
        return { processes: this.generateMockProcesses() };
      case 'shell:kill':
        return { success: true };
      case 'shell:autocomplete':
        return { suggestions: this.generateAutocompleteSuggestions(args[0].input) };
      case 'shell:ls':
        return { files: this.generateMockFiles(args[0].path || '.') };

      // APT service events
      case 'apt:list-installed':
        return { packages: this.generateMockPackages() };
      case 'apt:search':
        return { packages: this.generateMockPackages().filter(p => p.name.includes(args[0].query)) };
      case 'apt:info':
        return { info: this.generateMockPackageInfo(args[0].packageName) };
      case 'apt:install':
        // Handle installation with progress
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'install',
            packageName: args[0].packageName,
            progress: 50,
            status: `Installing ${args[0].packageName}...`,
            output: ['Downloading...', 'Installing...', 'Configuring...']
          });
        }, 50);
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'install',
            packageName: args[0].packageName,
            progress: 100,
            status: `Installation complete`,
            output: ['Installation completed successfully']
          });
        }, 150);
        return { success: true };
      case 'apt:remove':
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'remove',
            packageName: args[0].packageName,
            progress: 50,
            status: `Removing ${args[0].packageName}...`,
            output: ['Removing files...', 'Updating database...']
          });
        }, 50);
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'remove',
            packageName: args[0].packageName,
            progress: 100,
            status: `Removal complete`,
            output: ['Package removed successfully']
          });
        }, 150);
        return { success: true };
      case 'apt:update-package':
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'update',
            packageName: args[0].packageName,
            progress: 50,
            status: `Updating ${args[0].packageName}...`,
            output: ['Downloading update...', 'Installing update...']
          });
        }, 50);
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'update',
            packageName: args[0].packageName,
            progress: 100,
            status: `Update complete`,
            output: ['Package updated successfully']
          });
        }, 150);
        return { success: true };
      case 'apt:upgrade':
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'upgrade',
            packageName: 'all',
            progress: 30,
            status: 'Upgrading packages...',
            output: ['Checking for updates...', 'Downloading updates...']
          });
        }, 50);
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'upgrade',
            packageName: 'all',
            progress: 100,
            status: 'Upgrade complete',
            output: ['All packages upgraded successfully']
          });
        }, 200);
        return { success: true };
      case 'apt:update':
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'update',
            packageName: 'cache',
            progress: 50,
            status: 'Updating package cache...',
            output: ['Fetching package lists...', 'Building dependency tree...']
          });
        }, 50);
        setTimeout(() => {
          this.emit('apt:progress', {
            type: 'update',
            packageName: 'cache',
            progress: 100,
            status: 'Cache update complete',
            output: ['Package cache updated successfully']
          });
        }, 150);
        return { success: true };
      case 'apt:clean':
        return { success: true };
      case 'apt:system-info':
        return { info: this.generateMockSystemInfo() };
      case 'apt:list-upgradable':
        return { packages: this.generateMockPackages().filter(p => p.upgradable) };
      case 'apt:autoremove':
        return { success: true };

      // Terminal service events
      case 'terminal:execute':
        // Process terminal execution asynchronously
        setTimeout(() => {
          const { sessionId, command } = args[0];
          this.emit('terminal:output', {
            sessionId,
            output: `Mock terminal output for: ${command}`,
            type: 'stdout'
          });
          
          setTimeout(() => {
            this.emit('terminal:complete', {
              sessionId,
              exitCode: 0,
              duration: 100
            });
          }, 50);
        }, 30);
        return { success: true };

      default:
        return {};
    }
  }

  private generateMockProcesses() {
    return [
      {
        pid: 1,
        name: 'init',
        cpu: 0.1,
        memory: 2.1,
        user: 'root',
        command: '/sbin/init'
      },
      {
        pid: 1234,
        name: 'node',
        cpu: 1.2,
        memory: 45.6,
        user: 'testuser',
        command: 'node app.js'
      },
      {
        pid: 5678,
        name: 'nginx',
        cpu: 0.5,
        memory: 12.3,
        user: 'www-data',
        command: 'nginx: master process'
      }
    ];
  }

  private generateAutocompleteSuggestions(input: string) {
    const commands = ['ls', 'cd', 'pwd', 'echo', 'cat', 'grep', 'find', 'mkdir', 'rm', 'cp', 'mv'];
    return commands.filter(cmd => cmd.startsWith(input.split(' ').pop() || ''));
  }

  private generateMockFiles(path: string) {
    return [
      { name: 'src', isDirectory: true },
      { name: 'package.json', isDirectory: false },
      { name: 'README.md', isDirectory: false },
      { name: 'node_modules', isDirectory: true },
      { name: 'dist', isDirectory: true }
    ];
  }

  private generateMockPackages() {
    return [
      {
        name: 'nodejs',
        version: '18.17.0',
        description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine',
        size: '25.2 MB',
        installed: true,
        upgradable: false
      },
      {
        name: 'npm',
        version: '9.6.7',
        description: 'Package manager for JavaScript',
        size: '5.1 MB',
        installed: true,
        upgradable: true
      },
      {
        name: 'nginx',
        version: '1.18.0',
        description: 'HTTP and reverse proxy server',
        size: '1.8 MB',
        installed: true,
        upgradable: false
      },
      {
        name: 'curl',
        version: '7.68.0',
        description: 'Command line tool for transferring data with URL syntax',
        size: '256 KB',
        installed: true,
        upgradable: false
      }
    ];
  }

  private generateMockPackageInfo(packageName: string) {
    return {
      name: packageName,
      version: '1.0.0',
      description: `Mock package information for ${packageName}`,
      homepage: `https://example.com/${packageName}`,
      maintainer: 'Test Maintainer <test@example.com>',
      dependencies: ['libc6', 'ssl1.1'],
      size: '1.2 MB',
      installedSize: '5.6 MB',
      section: 'utils',
      priority: 'optional'
    };
  }

  private generateMockSystemInfo() {
    return {
      totalPackages: 45672,
      installedPackages: 1234,
      upgradablePackages: 23,
      diskUsage: '2.1 GB',
      lastUpdate: '2024-01-15 10:30:00'
    };
  }

  // Reset method for test cleanup
  reset() {
    this.removeAllListeners();
    this.connected = true;
  }
}

// Create a mock socket instance
export const createMockSocket = () => new MockSocket();

// Mock socket factory with different connection states
export const createDisconnectedSocket = () => {
  const socket = new MockSocket();
  socket.connected = false;
  return socket;
};

// Mock socket with specific response behavior
export const createSocketWithCustomResponses = (responses: Record<string, any>) => {
  const socket = new MockSocket();
  
  // Override handleEmit method
  const originalHandleEmit = socket.handleEmitSync.bind(socket);
  socket.handleEmitSync = (event: string, ...args: any[]) => {
    if (responses[event]) {
      return responses[event];
    }
    return originalHandleEmit(event, ...args);
  };
  
  return socket;
};