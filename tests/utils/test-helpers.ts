// Test utilities and helper functions

import { Process } from '@/lib/services/shellService';
import { Package, PackageInfo, SystemInfo } from '@/lib/services/aptService';
import { TerminalCommand, TerminalSession } from '@/lib/hooks/useTerminal';
import { MockSocket } from './mocks';

// Test data factories
export const createMockProcess = (overrides: Partial<Process> = {}): Process => ({
  pid: 1,
  name: 'init',
  cpu: 0.1,
  memory: 2.1,
  user: 'root',
  command: '/sbin/init',
  ...overrides,
});

export const createMockPackage = (overrides: Partial<Package> = {}): Package => ({
  name: 'test-package',
  version: '1.0.0',
  description: 'Test package for testing',
  size: '1.0 MB',
  installed: false,
  upgradable: false,
  ...overrides,
});

export const createMockPackageInfo = (overrides: Partial<PackageInfo> = {}): PackageInfo => ({
  name: 'test-package',
  version: '1.0.0',
  description: 'Test package information',
  homepage: 'https://example.com',
  maintainer: 'Test Maintainer <test@example.com>',
  dependencies: ['libc6'],
  size: '1.0 MB',
  installedSize: '5.0 MB',
  section: 'utils',
  priority: 'optional',
  ...overrides,
});

export const createMockSystemInfo = (overrides: Partial<SystemInfo> = {}): SystemInfo => ({
  totalPackages: 1000,
  installedPackages: 100,
  upgradablePackages: 5,
  diskUsage: '2.0 GB',
  lastUpdate: '2024-01-15 10:00:00',
  ...overrides,
});

export const createMockTerminalCommand = (overrides: Partial<TerminalCommand> = {}): TerminalCommand => ({
  command: 'test-command',
  output: ['test output'],
  exitCode: 0,
  timestamp: Date.now(),
  duration: 100,
  isRunning: false,
  ...overrides,
});

export const createMockTerminalSession = (overrides: Partial<TerminalSession> = {}): TerminalSession => ({
  id: 'test-session-1',
  title: 'Test Terminal',
  isActive: true,
  history: [],
  commandHistory: [],
  historyIndex: -1,
  currentInput: '',
  currentDirectory: '/home/test',
  isConnected: true,
  environment: {},
  ...overrides,
});

// Async test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForAsync = async (condition: () => boolean, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
    await waitFor(interval);
  }
};

// Mock response builders
export const buildShellExecuteResponse = (command: string, shouldSucceed = true) => ({
  type: shouldSucceed ? 'stdout' : 'stderr',
  content: shouldSucceed 
    ? `Mock output for: ${command}\n` 
    : `Error: Command failed: ${command}`,
  exitCode: shouldSucceed ? 0 : 1,
});

export const buildProcessList = (count = 5): Process[] => 
  Array.from({ length: count }, (_, i) => createMockProcess({
    pid: 1000 + i,
    name: `process-${i}`,
    cpu: Math.random() * 10,
    memory: Math.random() * 100,
  }));

export const buildPackageList = (count = 10): Package[] => 
  Array.from({ length: count }, (_, i) => createMockPackage({
    name: `package-${i}`,
    installed: Math.random() > 0.5,
    upgradable: Math.random() > 0.7,
  }));

export const buildTerminalHistory = (count = 10): TerminalCommand[] => 
  Array.from({ length: count }, (_, i) => createMockTerminalCommand({
    command: `command-${i}`,
    timestamp: Date.now() - (count - i) * 1000,
  }));

// Socket event emitters for testing
export class SocketEventEmitter {
  private events: Array<{ event: string; data: any }> = [];
  private socket: MockSocket;

  constructor(socket: MockSocket) {
    this.socket = socket;
  }

  emit(event: string, data: any, delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.socket.emit(event, data);
      }, delay);
    } else {
      this.socket.emit(event, data);
    }
    this.events.push({ event, data });
    return this;
  }

  getEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}

// Test assertion helpers
export const assertSocketEventEmitted = (socket: MockSocket, event: string, data?: any) => {
  expect(socket.emit).toHaveBeenCalledWith(event, data);
};

export const assertTerminalCommand = (
  command: TerminalCommand,
  expectedCommand: string,
  expectedExitCode?: number
) => {
  expect(command.command).toBe(expectedCommand);
  if (expectedExitCode !== undefined) {
    expect(command.exitCode).toBe(expectedExitCode);
  }
};

export const assertProcess = (process: Process, expectedName: string) => {
  expect(process.name).toBe(expectedName);
  expect(process.pid).toBeGreaterThan(0);
  expect(process.cpu).toBeGreaterThanOrEqual(0);
  expect(process.memory).toBeGreaterThanOrEqual(0);
};

export const assertPackage = (pkg: Package, expectedName: string) => {
  expect(pkg.name).toBe(expectedName);
  expect(pkg.version).toBeDefined();
  expect(pkg.installed).toBeDefined();
  expect(pkg.upgradable).toBeDefined();
};

// Error simulation helpers
export const simulateNetworkError = () => {
  return Promise.reject(new Error('Network connection failed'));
};

export const simulateTimeoutError = () => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), 1);
  });
};

export const simulatePermissionError = () => {
  return Promise.reject(new Error('Permission denied'));
};

// Mock cleanup utilities
export const cleanupSocketListeners = (socket: MockSocket) => {
  socket.removeAllListeners();
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock Date.now for consistent timestamps
  const mockDate = new Date('2024-01-15T10:00:00.000Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  
  return {
    mockDate,
    cleanup: () => {
      jest.restoreAllMocks();
    }
  };
};

// Performance testing utilities
export const measureExecutionTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

export const assertPerformance = (duration: number, maxDuration: number) => {
  expect(duration).toBeLessThan(maxDuration);
};

// Memory usage testing utilities
export const measureMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
};

// Mock file system utilities
export const createMockFileSystem = () => ({
  files: {
    '/home/test': { isDirectory: true, children: ['file1.txt', 'dir1'] },
    '/home/test/file1.txt': { isDirectory: false, content: 'Hello World' },
    '/home/test/dir1': { isDirectory: true, children: ['file2.txt'] },
    '/home/test/dir1/file2.txt': { isDirectory: false, content: 'Test content' },
  }
});

// Command execution utilities
export const simulateCommandExecution = async (
  socket: MockSocket,
  command: string,
  options: any = {}
) => {
  return new Promise<void>((resolve) => {
    socket.emit('shell:execute', { command, ...options });
    
    // Simulate output
    setTimeout(() => {
      socket.emit('shell:output', { type: 'stdout', content: `Output for: ${command}` });
    }, 50);
    
    setTimeout(() => {
      socket.emit('shell:exit', { exitCode: 0 });
      resolve();
    }, 100);
  });
};

// Validation helpers
export const validatePackageData = (pkg: any): pkg is Package => {
  return (
    typeof pkg.name === 'string' &&
    typeof pkg.version === 'string' &&
    typeof pkg.description === 'string' &&
    typeof pkg.installed === 'boolean' &&
    typeof pkg.upgradable === 'boolean'
  );
};

export const validateProcessData = (proc: any): proc is Process => {
  return (
    typeof proc.pid === 'number' &&
    typeof proc.name === 'string' &&
    typeof proc.cpu === 'number' &&
    typeof proc.memory === 'number'
  );
};

export const validateTerminalCommand = (cmd: any): cmd is TerminalCommand => {
  return (
    typeof cmd.command === 'string' &&
    Array.isArray(cmd.output) &&
    typeof cmd.timestamp === 'number'
  );
};