import { Socket } from 'socket.io-client';

export interface ExecuteOptions {
  timeout?: number;
  interactive?: boolean;
  shell?: 'bash' | 'sh' | 'zsh';
  environment?: Record<string, string>;
  cwd?: string;
}

export interface CommandOutput {
  type: 'stdout' | 'stderr' | 'exit';
  content: string;
  exitCode?: number;
  timestamp: number;
}

export interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user: string;
  command: string;
}

export class ShellService {
  private socket: Socket;
  private commandCache: Map<string, string[]> = new Map();

  constructor(socket: Socket) {
    this.socket = socket;
  }

  async* execute(
    command: string,
    options: ExecuteOptions = {}
  ): AsyncGenerator<CommandOutput> {
    const {
      timeout = 30000,
      interactive = false,
      shell = 'bash',
      environment = {},
      cwd
    } = options;

    return new Promise<AsyncGenerator<CommandOutput>>((resolve, reject) => {
      const outputs: CommandOutput[] = [];
      let isComplete = false;

      const handleOutput = (data: { type: 'stdout' | 'stderr'; content: string }) => {
        const output: CommandOutput = {
          type: data.type,
          content: data.content,
          timestamp: Date.now(),
        };
        outputs.push(output);
      };

      const handleExit = (data: { exitCode: number }) => {
        const exitOutput: CommandOutput = {
          type: 'exit',
          content: '',
          exitCode: data.exitCode,
          timestamp: Date.now(),
        };
        outputs.push(exitOutput);
        isComplete = true;
      };

      this.socket.on('shell:output', handleOutput);
      this.socket.on('shell:exit', handleExit);

      this.socket.emit('shell:execute', {
        command,
        shell,
        environment,
        cwd,
        interactive,
      });

      // Create async generator
      const generator = async function* () {
        while (!isComplete || outputs.length > 0) {
          if (outputs.length > 0) {
            yield outputs.shift()!;
          } else {
            await new Promise(res => setTimeout(res, 10));
          }
        }
      };

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!isComplete) {
          reject(new Error('Command execution timeout'));
        }
      }, timeout);

      resolve(generator());
    });
  }

  async getAvailableCommands(): Promise<string[]> {
    if (this.commandCache.has('available')) {
      return this.commandCache.get('available')!;
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('shell:available-commands', {}, (response: { commands: string[] }) => {
        if (response.commands) {
          this.commandCache.set('available', response.commands);
          resolve(response.commands);
        } else {
          reject(new Error('Failed to get available commands'));
        }
      });
    });
  }

  async getCommandHelp(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:help', { command }, (response: { help: string; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.help || 'No help available');
        }
      });
    });
  }

  async getEnvironmentVariables(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:env', {}, (response: { env: Record<string, string>; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.env || {});
        }
      });
    });
  }

  async setEnvironmentVariable(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:set-env', { key, value }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to set environment variable'));
        }
      });
    });
  }

  async getCurrentDirectory(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:pwd', {}, (response: { cwd: string; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.cwd || '~');
        }
      });
    });
  }

  async changeDirectory(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:cd', { path }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to change directory'));
        }
      });
    });
  }

  async getRunningProcesses(): Promise<Process[]> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:ps', {}, (response: { processes: Process[]; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.processes || []);
        }
      });
    });
  }

  async killProcess(pid: number, signal: string = 'SIGTERM'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:kill', { pid, signal }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to kill process'));
        }
      });
    });
  }

  async autocomplete(input: string, cursor: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:autocomplete', { input, cursor }, (response: { suggestions: string[]; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.suggestions || []);
        }
      });
    });
  }

  async listFiles(path: string = '.'): Promise<Array<{ name: string; isDirectory: boolean }>> {
    return new Promise((resolve, reject) => {
      this.socket.emit('shell:ls', { path }, (response: { files: Array<{ name: string; isDirectory: boolean }>; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.files || []);
        }
      });
    });
  }
}
