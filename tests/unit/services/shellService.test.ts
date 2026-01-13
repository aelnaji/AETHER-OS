import { ShellService, ExecuteOptions, CommandOutput, Process } from '@/lib/services/shellService';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('ShellService', () => {
  let mockSocket: Socket;
  let shellService: ShellService;

  beforeEach(() => {
    mockSocket = new (require('socket.io-client').Socket)();
    shellService = new ShellService(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute command and emit socket events', async () => {
      const emitSpy = jest.spyOn(mockSocket, 'emit');
      
      const generator = shellService.execute('echo "Hello World"');
      
      // Verify that the command was sent via socket
      expect(emitSpy).toHaveBeenCalledWith('shell:execute', expect.objectContaining({
        command: 'echo "Hello World"',
      }));

      // Clean up
      emitSpy.mockRestore();
    });

    it('should handle command timeout', async () => {
      const options: ExecuteOptions = { timeout: 10 };
      
      try {
        const generator = shellService.execute('sleep 100', options);
        await generator.next();
        fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).toContain('timeout');
      }
    });

    it('should handle command execution errors', async () => {
      const generator = shellService.execute('invalid-command');
      
      // Simulate error
      mockSocket.emit('shell:output', { type: 'stderr', content: 'Command not found' });
      mockSocket.emit('shell:exit', { exitCode: 127 });

      const outputs: CommandOutput[] = [];
      try {
        for await (const output of generator) {
          outputs.push(output);
        }
      } catch (error) {
        // Expected
      }

      expect(outputs.some(o => o.type === 'stderr')).toBe(true);
    });
  });

  describe('getAvailableCommands', () => {
    it('should return available commands', async () => {
      const mockCommands = ['ls', 'cd', 'pwd', 'echo'];
      
      // Mock the socket emit callback
      const emitMock = jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:available-commands' && callback) {
          callback({ commands: mockCommands });
        }
      });

      const commands = await shellService.getAvailableCommands();
      
      expect(commands).toEqual(mockCommands);
      expect(emitMock).toHaveBeenCalledWith('shell:available-commands', {}, expect.any(Function));
    });

    it('should cache available commands', async () => {
      const mockCommands = ['ls', 'cd'];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:available-commands' && callback) {
          callback({ commands: mockCommands });
        }
      });

      // First call
      await shellService.getAvailableCommands();
      // Second call should use cache
      const commands = await shellService.getAvailableCommands();

      expect(commands).toEqual(mockCommands);
    });

    it('should handle errors when getting available commands', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:available-commands' && callback) {
          callback({}); // No commands
        }
      });

      await expect(shellService.getAvailableCommands()).rejects.toThrow('Failed to get available commands');
    });
  });

  describe('getCommandHelp', () => {
    it('should return command help', async () => {
      const mockHelp = 'Usage: ls [options] [files]\\nList directory contents';
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:help' && callback) {
          callback({ help: mockHelp });
        }
      });

      const help = await shellService.getCommandHelp('ls');
      
      expect(help).toBe(mockHelp);
    });

    it('should return default message when no help available', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:help' && callback) {
          callback({ help: '' });
        }
      });

      const help = await shellService.getCommandHelp('nonexistent');
      
      expect(help).toBe('No help available');
    });

    it('should handle help errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:help' && callback) {
          callback({ error: 'Command not found' });
        }
      });

      await expect(shellService.getCommandHelp('invalid')).rejects.toThrow('Command not found');
    });
  });

  describe('environment management', () => {
    it('should get environment variables', async () => {
      const mockEnv = { PATH: '/usr/bin', HOME: '/home/user' };
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:env' && callback) {
          callback({ env: mockEnv });
        }
      });

      const env = await shellService.getEnvironmentVariables();
      
      expect(env).toEqual(mockEnv);
    });

    it('should set environment variable', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:set-env' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      await shellService.setEnvironmentVariable('TEST_VAR', 'test_value');
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle environment variable errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:set-env' && callback) {
          callback({ success: false, error: 'Permission denied' });
        }
      });

      await expect(shellService.setEnvironmentVariable('PROTECTED_VAR', 'value')).rejects.toThrow('Permission denied');
    });
  });

  describe('directory management', () => {
    it('should get current directory', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:pwd' && callback) {
          callback({ cwd: '/home/user' });
        }
      });

      const cwd = await shellService.getCurrentDirectory();
      
      expect(cwd).toBe('/home/user');
    });

    it('should change directory', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:cd' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      await shellService.changeDirectory('/tmp');
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle directory change errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:cd' && callback) {
          callback({ success: false, error: 'Directory not found' });
        }
      });

      await expect(shellService.changeDirectory('/nonexistent')).rejects.toThrow('Directory not found');
    });
  });

  describe('process management', () => {
    it('should get running processes', async () => {
      const mockProcesses: Process[] = [
        { pid: 1, name: 'node', cpu: 10.5, memory: 512, user: 'root', command: 'node server.js' },
        { pid: 2, name: 'nginx', cpu: 5.2, memory: 256, user: 'www-data', command: 'nginx -g daemon off;' },
      ];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:ps' && callback) {
          callback({ processes: mockProcesses });
        }
      });

      const processes = await shellService.getRunningProcesses();
      
      expect(processes).toEqual(mockProcesses);
    });

    it('should kill process', async () => {
      let successCallbackCalled = false;
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:kill' && callback) {
          successCallbackCalled = true;
          callback({ success: true });
        }
      });

      await shellService.killProcess(1234);
      
      expect(successCallbackCalled).toBe(true);
    });

    it('should handle process kill errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:kill' && callback) {
          callback({ success: false, error: 'Process not found' });
        }
      });

      await expect(shellService.killProcess(99999)).rejects.toThrow('Process not found');
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const mockSuggestions = ['ls', 'lsof', 'lsblk'];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:autocomplete' && callback) {
          callback({ suggestions: mockSuggestions });
        }
      });

      const suggestions = await shellService.autocomplete('ls', 2);
      
      expect(suggestions).toEqual(mockSuggestions);
    });

    it('should handle autocomplete errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:autocomplete' && callback) {
          callback({ error: 'Autocomplete failed' });
        }
      });

      await expect(shellService.autocomplete('invalid', 0)).rejects.toThrow('Autocomplete failed');
    });
  });

  describe('file operations', () => {
    it('should list files', async () => {
      const mockFiles = [
        { name: 'file1.txt', isDirectory: false },
        { name: 'dir1', isDirectory: true },
      ];
      
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:ls' && callback) {
          callback({ files: mockFiles });
        }
      });

      const files = await shellService.listFiles('/tmp');
      
      expect(files).toEqual(mockFiles);
    });

    it('should handle file listing errors', async () => {
      jest.spyOn(mockSocket, 'emit').mockImplementation((event, data, callback) => {
        if (event === 'shell:ls' && callback) {
          callback({ error: 'Directory not found' });
        }
      });

      await expect(shellService.listFiles('/nonexistent')).rejects.toThrow('Directory not found');
    });
  });
});