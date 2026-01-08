import { ToolCallResult } from '@/lib/types/chat';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/utils/logger';

export class BytebotToolExecutor {
  private socket: Socket;
  private ownsSocket: boolean;

  constructor(endpointOrSocket: string | Socket = process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT || 'http://localhost:3001') {
    if (typeof endpointOrSocket === 'string') {
      this.socket = io(endpointOrSocket, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });
      this.ownsSocket = true;
    } else {
      this.socket = endpointOrSocket;
      this.ownsSocket = false;
    }

    this.socket.on('connect_error', (error) => {
      logger.warn('Bytebot connection error', error);
    });
  }

  getSocket(): Socket {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  async executeTool(toolName: string, toolInput: Record<string, any>): Promise<ToolCallResult> {
    if (!this.socket.connected) {
      throw new Error('Not connected to Bytebot backend');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit(
        'tool:execute',
        {
          toolName,
          toolInput,
          timestamp: Date.now(),
        },
        (result: any) => {
          if (result?.success) {
            resolve({
              id: toolName,
              name: toolName,
              arguments: JSON.stringify(toolInput),
              success: true,
              output: result.output,
            });
          } else {
            reject(new Error(result?.error || 'Tool execution failed'));
          }
        }
      );
    });
  }

  async handleInstallApp(input: { app_name: string; app_id: string; icon: string }): Promise<ToolCallResult> {
    return this.executeTool('install_app', input);
  }

  async handleOpenApp(input: { app_id: string }): Promise<ToolCallResult> {
    return this.executeTool('open_app', input);
  }

  async handleRunCommand(input: { command: string }): Promise<ToolCallResult> {
    return this.executeTool('run_command', input);
  }

  async handleWriteFile(input: { path: string; content: string }): Promise<ToolCallResult> {
    return this.executeTool('write_file', input);
  }

  disconnect() {
    if (!this.ownsSocket) return;
    this.socket.disconnect();
  }

  onTerminalOutput(callback: (line: string) => void) {
    this.socket.on('terminal:output', callback);
  }

  onFileSystemChange(callback: (change: any) => void) {
    this.socket.on('filesystem:changed', callback);
  }

  onDesktopState(callback: (state: any) => void) {
    this.socket.on('desktop:state', callback);
  }
}
