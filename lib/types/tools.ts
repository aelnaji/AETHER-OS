export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
}

export interface ToolExecutionInput {
  toolName: string;
  toolInput: Record<string, any>;
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  output?: string;
  error?: string;
}
