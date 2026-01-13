import { ShellService, ExecuteOptions, CommandOutput, Process } from '@/lib/services/shellService';
import { MockSocket, createMockSocket } from '@/tests/utils/mocks';
import {
  createMockProcess,
  buildProcessList,
  waitFor,
  simulateNetworkError,
  simulatePermissionError,
  setupTestEnvironment
} from '@/tests/utils/test-helpers';

describe('ShellService', () => {
  let shellService: ShellService;
  let mockSocket: MockSocket;
  let testEnv: any;

  beforeEach(() => {
    mockSocket = createMockSocket();
    shellService = new ShellService(mockSocket);
    testEnv = setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('constructor', () => {
    it('should initialize with provided socket', () => {
      expect(shellService).toBeDefined();
      expect(shellService).toHaveProperty('socket');
    });
  });

  describe('execute', () => {
    it('should execute a basic command successfully', async () => {
      const command = 'ls -la';
      const outputs: CommandOutput[] = [];

      const generator = shellService.execute(command);
      
      // Wait for all outputs to be collected
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs).toHaveLength(2); // stdout + exit
      expect(outputs[0]).toHaveProperty('type', 'stdout');
      expect(outputs[0]).toHaveProperty('content');
      expect(outputs[1]).toHaveProperty('type', 'exit');
      expect(outputs[1]).toHaveProperty('exitCode', 0);
    }, 1000); // Increase timeout for async operations

    it('should handle command execution with options', async () => {
      const command = 'echo "test"';
      const options: ExecuteOptions = {
        timeout: 5000,
        interactive: true,
        shell: 'bash',
        environment: { TEST: 'value' },
        cwd: '/home/test'
      };

      const generator = shellService.execute(command, options);
      const outputs: CommandOutput[] = [];

      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(0);
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:execute', {
        command,
        shell: 'bash',
        environment: { TEST: 'value' },
        cwd: '/home/test',
        interactive: true
      });
    });

    it('should handle command execution timeout', async () => {
      const command = 'sleep 10';
      const options: ExecuteOptions = { timeout: 100 };

      const generator = shellService.execute(command, options);
      
      await expect(async () => {
        for await (const output of generator) {
          // This should timeout
        }
      }).rejects.toThrow('Command execution timeout');
    });

    it('should handle command execution with errors', async () => {
      const command = 'invalid-command';
      const outputs: CommandOutput[] = [];

      const generator = shellService.execute(command);
      
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs).toHaveLength(2);
      expect(outputs[0]).toHaveProperty('type', 'stderr');
      expect(outputs[1]).toHaveProperty('exitCode', 1);
    });

    it('should use default options when not provided', async () => {
      const command = 'pwd';

      const generator = shellService.execute(command);
      const outputs: CommandOutput[] = [];

      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(0);
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:execute', {
        command,
        shell: 'bash',
        environment: {},
        cwd: undefined,
        interactive: false
      });
    });
  });

  describe('getAvailableCommands', () => {
    it('should return available commands from cache', async () => {
      // First call
      const commands1 = await shellService.getAvailableCommands();
      expect(commands1).toEqual(expect.arrayContaining(['ls', 'cd', 'pwd']));

      // Second call should use cache
      const commands2 = await shellService.getAvailableCommands();
      expect(commands2).toEqual(commands1);
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching available commands', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:available-commands') {
          callback({ error: 'Failed to fetch commands' });
        }
      });

      await expect(shellService.getAvailableCommands()).rejects.toThrow('Failed to get available commands');
    });
  });

  describe('getCommandHelp', () => {
    it('should return help for a command', async () => {
      const command = 'ls';
      const help = await shellService.getCommandHelp(command);

      expect(help).toBe('Mock help for ls');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:help', { command }, expect.any(Function));
    });

    it('should handle missing help', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:help') {
          callback({ help: '' });
        }
      });

      const help = await shellService.getCommandHelp('nonexistent');
      expect(help).toBe('No help available');
    });

    it('should handle errors when fetching help', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:help') {
          callback({ error: 'Help not found' });
        }
      });

      await expect(shellService.getCommandHelp('invalid')).rejects.toThrow('Help not found');
    });
  });

  describe('getEnvironmentVariables', () => {
    it('should return environment variables', async () => {
      const env = await shellService.getEnvironmentVariables();

      expect(env).toHaveProperty('PATH');
      expect(env).toHaveProperty('HOME');
      expect(env).toHaveProperty('USER');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:env', {}, expect.any(Function));
    });

    it('should handle errors when fetching environment variables', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:env') {
          callback({ error: 'Permission denied' });
        }
      });

      await expect(shellService.getEnvironmentVariables()).rejects.toThrow('Permission denied');
    });

    it('should return empty object when no environment variables', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:env') {
          callback({ env: null });
        }
      });

      const env = await shellService.getEnvironmentVariables();
      expect(env).toEqual({});
    });
  });

  describe('setEnvironmentVariable', () => {
    it('should set environment variable successfully', async () => {
      const key = 'TEST_VAR';
      const value = 'test_value';

      await shellService.setEnvironmentVariable(key, value);

      expect(mockSocket.emit).toHaveBeenCalledWith('shell:set-env', { key, value }, expect.any(Function));
    });

    it('should handle errors when setting environment variable', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:set-env') {
          callback({ success: false, error: 'Variable name invalid' });
        }
      });

      await expect(shellService.setEnvironmentVariable('invalid@var', 'value')).rejects.toThrow('Variable name invalid');
    });

    it('should handle generic errors', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:set-env') {
          callback({ success: false });
        }
      });

      await expect(shellService.setEnvironmentVariable('VAR', 'value')).rejects.toThrow('Failed to set environment variable');
    });
  });

  describe('getCurrentDirectory', () => {
    it('should return current directory', async () => {
      const cwd = await shellService.getCurrentDirectory();

      expect(cwd).toBe('/home/test');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:pwd', {}, expect.any(Function));
    });

    it('should return home directory when none specified', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:pwd') {
          callback({ cwd: null });
        }
      });

      const cwd = await shellService.getCurrentDirectory();
      expect(cwd).toBe('~');
    });

    it('should handle errors when getting current directory', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:pwd') {
          callback({ error: 'Directory not found' });
        }
      });

      await expect(shellService.getCurrentDirectory()).rejects.toThrow('Directory not found');
    });
  });

  describe('changeDirectory', () => {
    it('should change directory successfully', async () => {
      const path = '/home/user';

      await shellService.changeDirectory(path);

      expect(mockSocket.emit).toHaveBeenCalledWith('shell:cd', { path }, expect.any(Function));
    });

    it('should handle errors when changing directory', async () => {
      const path = '/nonexistent';

      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:cd') {
          callback({ success: false, error: 'Directory not found' });
        }
      });

      await expect(shellService.changeDirectory(path)).rejects.toThrow('Directory not found');
    });

    it('should handle generic errors', async () => {
      const path = '/error/path';

      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:cd') {
          callback({ success: false });
        }
      });

      await expect(shellService.changeDirectory(path)).rejects.toThrow('Failed to change directory');
    });
  });

  describe('getRunningProcesses', () => {
    it('should return list of running processes', async () => {
      const processes = await shellService.getRunningProcesses();

      expect(Array.isArray(processes)).toBe(true);
      expect(processes.length).toBeGreaterThan(0);
      processes.forEach(proc => {
        expect(proc).toHaveProperty('pid');
        expect(proc).toHaveProperty('name');
        expect(proc).toHaveProperty('cpu');
        expect(proc).toHaveProperty('memory');
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:ps', {}, expect.any(Function));
    });

    it('should handle errors when getting processes', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:ps') {
          callback({ error: 'Permission denied' });
        }
      });

      await expect(shellService.getRunningProcesses()).rejects.toThrow('Permission denied');
    });

    it('should return empty array when no processes', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:ps') {
          callback({ processes: null });
        }
      });

      const processes = await shellService.getRunningProcesses();
      expect(processes).toEqual([]);
    });
  });

  describe('killProcess', () => {
    it('should kill process successfully', async () => {
      const pid = 1234;

      await shellService.killProcess(pid);

      expect(mockSocket.emit).toHaveBeenCalledWith('shell:kill', { pid, signal: 'SIGTERM' }, expect.any(Function));
    });

    it('should kill process with custom signal', async () => {
      const pid = 1234;
      const signal = 'SIGKILL';

      await shellService.killProcess(pid, signal);

      expect(mockSocket.emit).toHaveBeenCalledWith('shell:kill', { pid, signal }, expect.any(Function));
    });

    it('should handle errors when killing process', async () => {
      const pid = 9999;

      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:kill') {
          callback({ success: false, error: 'Process not found' });
        }
      });

      await expect(shellService.killProcess(pid)).rejects.toThrow('Process not found');
    });

    it('should handle generic errors', async () => {
      const pid = 9999;

      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:kill') {
          callback({ success: false });
        }
      });

      await expect(shellService.killProcess(pid)).rejects.toThrow('Failed to kill process');
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const input = 'l';
      const cursor = 1;

      const suggestions = await shellService.autocomplete(input, cursor);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions).toContain('ls');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:autocomplete', { input, cursor }, expect.any(Function));
    });

    it('should handle errors during autocomplete', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:autocomplete') {
          callback({ error: 'Autocomplete service unavailable' });
        }
      });

      await expect(shellService.autocomplete('test', 0)).rejects.toThrow('Autocomplete service unavailable');
    });

    it('should return empty array when no suggestions', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:autocomplete') {
          callback({ suggestions: null });
        }
      });

      const suggestions = await shellService.autocomplete('nonexistent', 0);
      expect(suggestions).toEqual([]);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      const path = '/home/test';

      const files = await shellService.listFiles(path);

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('isDirectory');
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:ls', { path }, expect.any(Function));
    });

    it('should list files in current directory when no path provided', async () => {
      const files = await shellService.listFiles();

      expect(Array.isArray(files)).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:ls', { path: '.' }, expect.any(Function));
    });

    it('should handle errors when listing files', async () => {
      const path = '/nonexistent';

      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:ls') {
          callback({ error: 'Directory not found' });
        }
      });

      await expect(shellService.listFiles(path)).rejects.toThrow('Directory not found');
    });

    it('should return empty array when no files found', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:ls') {
          callback({ files: null });
        }
      });

      const files = await shellService.listFiles();
      expect(files).toEqual([]);
    });
  });

  describe('Integration tests', () => {
    it('should handle multiple sequential commands', async () => {
      const commands = ['echo "test1"', 'echo "test2"', 'echo "test3"'];
      const allOutputs: CommandOutput[][] = [];

      for (const command of commands) {
        const generator = shellService.execute(command);
        const outputs: CommandOutput[] = [];
        
        for await (const output of generator) {
          outputs.push(output);
        }
        
        allOutputs.push(outputs);
      }

      expect(allOutputs).toHaveLength(3);
      allOutputs.forEach(outputs => {
        expect(outputs).toHaveLength(2);
        expect(outputs[1]).toHaveProperty('exitCode', 0);
      });
    });

    it('should handle concurrent command execution', async () => {
      const commands = ['ls', 'pwd', 'whoami'];
      
      const generators = commands.map(command => shellService.execute(command));
      const allOutputs = await Promise.all(
        generators.map(async generator => {
          const outputs: CommandOutput[] = [];
          for await (const output of generator) {
            outputs.push(output);
          }
          return outputs;
        })
      );

      expect(allOutputs).toHaveLength(3);
      allOutputs.forEach(outputs => {
        expect(outputs).toHaveLength(2);
      });
    });

    it('should handle rapid successive commands', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const generator = shellService.execute(`echo "command ${i}"`);
        const promise = (async () => {
          const outputs: CommandOutput[] = [];
          for await (const output of generator) {
            outputs.push(output);
          }
          return outputs;
        })();
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach(outputs => {
        expect(outputs).toHaveLength(2);
      });
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle socket disconnection during command execution', async () => {
      const generator = shellService.execute('long-running-command');
      
      // Simulate disconnection
      mockSocket.connected = false;
      
      const outputs: CommandOutput[] = [];
      for await (const output of generator) {
        outputs.push(output);
      }

      expect(outputs.length).toBeGreaterThan(0);
    });

    it('should handle malformed socket responses', async () => {
      mockSocket.emit = jest.fn().mockImplementation((event, data, callback) => {
        if (event === 'shell:execute') {
          // Don't call callback - simulate socket error
        }
      });

      const generator = shellService.execute('test-command');
      
      await expect(async () => {
        for await (const output of generator) {
          // Should handle error gracefully
        }
      }).not.toThrow();
    });

    it('should handle commands with special characters', async () => {
      const specialCommands = [
        'echo "test with quotes"',
        'echo "test$HOME"',
        'echo "test with `backticks`"',
        'find . -name "*.txt"',
      ];

      for (const command of specialCommands) {
        const generator = shellService.execute(command);
        const outputs: CommandOutput[] = [];
        
        for await (const output of generator) {
          outputs.push(output);
        }
        
        expect(outputs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance tests', () => {
    it('should execute commands within reasonable time', async () => {
      const start = performance.now();
      const generator = shellService.execute('echo "performance test"');
      
      const outputs: CommandOutput[] = [];
      for await (const output of generator) {
        outputs.push(output);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large command output efficiently', async () => {
      const generator = shellService.execute('find /usr -name "*.so" 2>/dev/null | head -100');
      
      let totalOutput = '';
      let outputCount = 0;
      
      for await (const output of generator) {
        if (output.type === 'stdout') {
          totalOutput += output.content;
          outputCount++;
        }
      }
      
      expect(outputCount).toBeGreaterThan(0);
      expect(totalOutput.length).toBeGreaterThan(0);
    });
  });
});