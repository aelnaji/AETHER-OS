import { useWindowStore } from '@/lib/stores/windowStore';
import { useFileSystemStore } from '@/lib/stores/fileSystemStore';
import { ToolExecutionResult } from '@/lib/types/tools';

interface ToolInput {
  toolName: string;
  toolInput: Record<string, any>;
}

export class ToolExecutor {
  private windowStore: ReturnType<typeof useWindowStore.getState>;
  private fileSystemStore: ReturnType<typeof useFileSystemStore.getState>;

  constructor() {
    this.windowStore = useWindowStore.getState();
    this.fileSystemStore = useFileSystemStore.getState();
  }

  async executeTool(toolName: string, toolInput: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      let result: string;

      switch (toolName) {
        case 'install_app':
          result = await this.handleInstallApp(toolInput as { app_name: string; app_id: string; icon: string });
          break;
        case 'open_app':
          result = await this.handleOpenApp(toolInput as { app_id: string });
          break;
        case 'run_command':
          result = await this.handleRunCommand(toolInput as { command: string });
          break;
        case 'write_file':
          result = await this.handleWriteFile(toolInput as { path: string; content: string });
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      return {
        toolName,
        success: true,
        output: result,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeTools(toolCalls: Array<{ name: string; arguments: string }>): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const input = JSON.parse(toolCall.arguments);
        const result = await this.executeTool(toolCall.name, input);
        results.push(result);
      } catch (error) {
        results.push({
          toolName: toolCall.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  private async handleInstallApp(input: { app_name: string; app_id: string; icon: string }): Promise<string> {
    this.fileSystemStore.installApp(input.app_id, input.app_name, input.icon);
    return `Successfully installed ${input.app_name} with ID "${input.app_id}"`;
  }

  private async handleOpenApp(input: { app_id: string }): Promise<string> {
    const titles: Record<string, string> = {
      'terminal': 'Terminal',
      'aether-chat': 'A.E Chat',
      'vscode': 'VS Code',
      'chrome': 'Chrome',
      'settings': 'Settings',
      'calculator': 'Calculator',
      'music': 'Music Player',
      'files': 'File Manager',
    };

    const title = titles[input.app_id] || input.app_id;
    this.windowStore.openWindow(input.app_id, title);
    return `Opening ${title}...`;
  }

  private async handleRunCommand(input: { command: string }): Promise<string> {
    return `[Command Simulation] Would execute: ${input.command}`;
  }

  private async handleWriteFile(input: { path: string; content: string }): Promise<string> {
    this.fileSystemStore.writeFile(input.path, input.content);
    return `Successfully wrote to ${input.path}`;
  }
}

export const toolExecutor = new ToolExecutor();
