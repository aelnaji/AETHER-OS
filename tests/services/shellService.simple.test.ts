import { ShellService } from '@/lib/services/shellService';
import { createMockSocket } from '@/tests/utils/mocks';

describe('ShellService', () => {
  let shellService: ShellService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = createMockSocket();
    shellService = new ShellService(mockSocket);
  });

  describe('constructor', () => {
    it('should initialize with provided socket', () => {
      expect(shellService).toBeDefined();
      expect(shellService).toHaveProperty('socket');
      expect(shellService.socket).toBe(mockSocket);
    });
  });

  describe('getAvailableCommands', () => {
    it('should return available commands', async () => {
      const commands = await shellService.getAvailableCommands();
      
      expect(commands).toBeInstanceOf(Array);
      expect(commands.length).toBeGreaterThan(0);
      expect(commands).toContain('ls');
      expect(commands).toContain('cd');
      expect(commands).toContain('pwd');
    });

    it('should handle socket errors gracefully', async () => {
      // Mock socket to return error
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:available-commands') {
          callback({ error: 'Socket error' });
        }
      });

      await expect(shellService.getAvailableCommands()).rejects.toThrow('Failed to get available commands');
    });
  });

  describe('getCurrentDirectory', () => {
    it('should return current directory', async () => {
      const cwd = await shellService.getCurrentDirectory();
      
      expect(cwd).toBe('/home/test');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:pwd', {}, expect.any(Function));
    });

    it('should handle errors when getting current directory', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:pwd') {
          callback({ error: 'Directory not accessible' });
        }
      });

      await expect(shellService.getCurrentDirectory()).rejects.toThrow('Directory not accessible');
    });
  });

  describe('changeDirectory', () => {
    it('should change directory successfully', async () => {
      await shellService.changeDirectory('/home/user');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:cd', { path: '/home/user' }, expect.any(Function));
    });

    it('should handle directory change errors', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:cd') {
          callback({ success: false, error: 'No such file or directory' });
        }
      });

      await expect(shellService.changeDirectory('/nonexistent')).rejects.toThrow('No such file or directory');
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
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:env') {
          callback({ error: 'Permission denied' });
        }
      });

      await expect(shellService.getEnvironmentVariables()).rejects.toThrow('Permission denied');
    });
  });

  describe('setEnvironmentVariable', () => {
    it('should set environment variable successfully', async () => {
      await shellService.setEnvironmentVariable('TEST_VAR', 'test_value');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:set-env', {
        key: 'TEST_VAR',
        value: 'test_value'
      }, expect.any(Function));
    });

    it('should handle errors when setting environment variable', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:set-env') {
          callback({ success: false, error: 'Invalid variable name' });
        }
      });

      await expect(shellService.setEnvironmentVariable('invalid@var', 'value')).rejects.toThrow('Invalid variable name');
    });
  });

  describe('getRunningProcesses', () => {
    it('should return list of running processes', async () => {
      const processes = await shellService.getRunningProcesses();
      
      expect(processes).toBeInstanceOf(Array);
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
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:ps') {
          callback({ error: 'Permission denied' });
        }
      });

      await expect(shellService.getRunningProcesses()).rejects.toThrow('Permission denied');
    });
  });

  describe('killProcess', () => {
    it('should kill process successfully', async () => {
      const pid = 1234;
      
      await shellService.killProcess(pid);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:kill', {
        pid,
        signal: 'SIGTERM'
      }, expect.any(Function));
    });

    it('should kill process with custom signal', async () => {
      const pid = 1234;
      const signal = 'SIGKILL';
      
      await shellService.killProcess(pid, signal);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:kill', {
        pid,
        signal
      }, expect.any(Function));
    });

    it('should handle errors when killing process', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:kill') {
          callback({ success: false, error: 'Process not found' });
        }
      });

      await expect(shellService.killProcess(9999)).rejects.toThrow('Process not found');
    });
  });

  describe('getCommandHelp', () => {
    it('should return help for a command', async () => {
      const command = 'ls';
      const help = await shellService.getCommandHelp(command);
      
      expect(help).toBe('Mock help for ls');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:help', { command }, expect.any(Function));
    });

    it('should handle errors when fetching help', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:help') {
          callback({ error: 'Help not found' });
        }
      });

      await expect(shellService.getCommandHelp('nonexistent')).rejects.toThrow('Help not found');
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const input = 'l';
      const suggestions = await shellService.autocomplete(input, 1);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions).toContain('ls');
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:autocomplete', { input, cursor: 1 }, expect.any(Function));
    });

    it('should handle errors during autocomplete', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:autocomplete') {
          callback({ error: 'Autocomplete service unavailable' });
        }
      });

      await expect(shellService.autocomplete('test', 0)).rejects.toThrow('Autocomplete service unavailable');
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      const path = '/home/test';
      const files = await shellService.listFiles(path);
      
      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThan(0);
      files.forEach(file => {
        expect(file).toHaveProperty('name');
        expect(file).toHaveProperty('isDirectory');
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('shell:ls', { path }, expect.any(Function));
    });

    it('should handle errors when listing files', async () => {
      mockSocket.emit.mockImplementationOnce((event: string, data: any, callback: Function) => {
        if (event === 'shell:ls') {
          callback({ error: 'Directory not found' });
        }
      });

      await expect(shellService.listFiles('/nonexistent')).rejects.toThrow('Directory not found');
    });
  });
});