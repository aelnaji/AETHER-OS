export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  tools?: ToolSchema[];
}

export interface DesktopApp extends AppConfig {
  installed: boolean;
  installDate?: Date;
  isPinned?: boolean;
}
