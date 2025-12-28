export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  component: string; // Component identifier
}

export interface DesktopApp extends AppConfig {
  position: { x: number; y: number };
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
