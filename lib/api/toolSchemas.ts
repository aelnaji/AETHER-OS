import { ToolDefinition } from '@/lib/types/tools';

export const INSTALL_APP_SCHEMA: ToolDefinition = {
  type: 'function',
  function: {
    name: 'install_app',
    description: 'Install an application to the AETHER OS desktop. Creates a new app icon.',
    parameters: {
      type: 'object',
      properties: {
        app_name: {
          type: 'string',
          description: 'Name of the app to install (e.g., "VS Code", "Chrome", "Terminal")',
        },
        app_id: {
          type: 'string',
          description: 'Unique identifier for the app (e.g., "vscode", "chrome", "terminal")',
        },
        icon: {
          type: 'string',
          enum: ['Code2', 'Chrome', 'Terminal', 'FileText', 'Settings', 'Music', 'Image', 'Video', 'Book', 'Calculator'],
          description: 'Lucide icon name for the app',
        },
      },
      required: ['app_name', 'app_id', 'icon'],
    },
  },
};

export const OPEN_APP_SCHEMA: ToolDefinition = {
  type: 'function',
  function: {
    name: 'open_app',
    description: 'Open an installed application window on the AETHER OS desktop.',
    parameters: {
      type: 'object',
      properties: {
        app_id: {
          type: 'string',
          description: 'ID of the app to open (e.g., "aether-chat", "terminal", "vscode")',
        },
      },
      required: ['app_id'],
    },
  },
};

export const RUN_COMMAND_SCHEMA: ToolDefinition = {
  type: 'function',
  function: {
    name: 'run_command',
    description: 'Execute a terminal command in the AETHER OS terminal. Supports Unix-like commands and apt package manager.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Terminal command to execute (e.g., "apt install code", "ls -la", "echo Hello")',
        },
      },
      required: ['command'],
    },
  },
};

export const WRITE_FILE_SCHEMA: ToolDefinition = {
  type: 'function',
  function: {
    name: 'write_file',
    description: 'Write content to a file in the AETHER OS file system.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path (e.g., "/home/user/file.txt", "/root/script.sh")',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
};

export const ALL_TOOL_SCHEMAS: ToolDefinition[] = [
  INSTALL_APP_SCHEMA,
  OPEN_APP_SCHEMA,
  RUN_COMMAND_SCHEMA,
  WRITE_FILE_SCHEMA,
];

export const AE_SYSTEM_PROMPT = `You are A.E (AETHER ENGINE), an intelligent AI assistant integrated into the AETHER OS desktop environment. You have the ability to control the operating system and execute commands.

Your personality:
- Helpful, intelligent, and conversational
- Technical but accessible to all users
- Always explain what you're doing before executing tools
- When performing actions, describe them in natural language

Your capabilities:
- Install and open applications
- Execute terminal commands and manage the file system
- Answer questions and provide assistance
- Learn from user interactions

Guidelines:
- Always ask for confirmation before installing large packages
- Provide feedback on what you're doing
- Handle errors gracefully
- Suggest relevant tools/apps based on user needs
- Maintain conversation context across multiple interactions

Available tools: install_app, open_app, run_command, write_file`;
