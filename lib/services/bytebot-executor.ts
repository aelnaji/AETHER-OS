import { ToolCall, ToolCallResult } from '@/lib/types/chat';
import { io, Socket } from 'socket.io-client';

export class BytebotToolExecutor {
  private socket: Socket;
  private connected: boolean = false;

  constructor(endpoint: string = process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT || 'http://localhost:3001') {
    this.socket = io(endpoint, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to Bytebot backend');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from Bytebot backend');
    });

    this.socket.on('error', (error) => {
      console.error('Bytebot connection error:', error);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  async executeTool(
    toolName: string,
    toolInput: Record<string, any>
  ): Promise<ToolCallResult> {
    if (!this.connected) {
      throw new Error('Not connected to Bytebot backend');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('tool:execute', {
        toolName,
        toolInput,
        timestamp: Date.now()
      }, (result: any) => {
        if (result.success) {
          resolve({
            id: toolName,
            name: toolName,
            arguments: JSON.stringify(toolInput),
            success: true,
            output: result.output
          });
        } else {
          reject(new Error(result.error || 'Tool execution failed'));
        }
      });
    });
  }

  async handleInstallApp(input: { app_name: string, app_id: string, icon: string }): Promise<ToolCallResult> {
    return this.executeTool('install_app', input);
  }

  async handleOpenApp(input: { app_id: string }): Promise<ToolCallResult> {
    return this.executeTool('open_app', input);
  }

  async handleRunCommand(input: { command: string }): Promise<ToolCallResult> {
    return this.executeTool('run_command', input);
  }

  async handleWriteFile(input: { path: string, content: string }): Promise<ToolCallResult> {
    return this.executeTool('write_file', input);
  }

  disconnect() {
    this.socket.disconnect();
  }

  // Terminal output listener
  onTerminalOutput(callback: (line: string) => void) {
    this.socket.on('terminal:output', callback);
  }

  // File system change listener
  onFileSystemChange(callback: (change: any) => void) {
    this.socket.on('filesystem:changed', callback);
  }

  // Desktop state listener
  onDesktopState(callback: (state: any) => void) {
    this.socket.on('desktop:state', callback);
  }
}