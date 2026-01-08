import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NvidiaClient } from '@/lib/api/nvidiaClient';

interface LLMSettings {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface SettingsStore {
  llmSettings: LLMSettings;
  isConfigured: boolean;
  updateLLMSettings: (settings: Partial<LLMSettings>) => void;
  resetToDefaults: () => void;
  validateSettings: () => Promise<boolean>;
  testConnection: () => Promise<boolean>;
}

const DEFAULT_SETTINGS: LLMSettings = {
  endpoint: 'https://integrate.api.nvidia.com/v1',
  apiKey: '',
  model: 'meta/llama-3.1-405b-instruct',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: `You are A.E (AETHER ENGINE), an autonomous AI agent integrated into AETHER-OS running on a local Docker environment. You can control the desktop, execute code, manage files, and accomplish real tasks. You have access to:
- Terminal/shell commands
- File system operations (read, write, create, delete)
- Application launching and management
- Code execution (Python, Node.js, Bash)
- Git operations

Be conversational, helpful, and always explain what you're doing before executing tools.`
};

export const NVIDIA_MODELS = [
  'meta/llama-3.1-405b-instruct',
  'mistralai/mistral-large',
  'meta/llama-3.1-70b-instruct',
  'qwen/qwen-1.5-32b-chat',
  'mistralai/mistral-7b-instruct'
];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      llmSettings: { ...DEFAULT_SETTINGS },
      isConfigured: false,

      updateLLMSettings: (settings) => {
        set((state) => {
          const updatedSettings = { ...state.llmSettings, ...settings };
          const isConfigured = !!updatedSettings.apiKey && updatedSettings.apiKey.length > 0;
          return {
            llmSettings: updatedSettings,
            isConfigured
          };
        });
      },

      resetToDefaults: () => {
        set({
          llmSettings: { ...DEFAULT_SETTINGS },
          isConfigured: false
        });
      },

      validateSettings: async () => {
        const { llmSettings } = get();
        if (!llmSettings.apiKey || llmSettings.apiKey.length === 0) {
          return false;
        }
        
        if (!llmSettings.endpoint || !llmSettings.endpoint.startsWith('http')) {
          return false;
        }
        
        if (!llmSettings.model || llmSettings.model.length === 0) {
          return false;
        }
        
        if (llmSettings.temperature < 0 || llmSettings.temperature > 1) {
          return false;
        }
        
        if (llmSettings.maxTokens < 1 || llmSettings.maxTokens > 4096) {
          return false;
        }
        
        return true;
      },

      testConnection: async () => {
        const { llmSettings } = get();
        
        if (!llmSettings.apiKey) {
          return false;
        }
        
        try {
          const client = new NvidiaClient(llmSettings.apiKey);
          return await client.validateApiKey();
        } catch (error) {
          console.error('Connection test failed:', error);
          return false;
        }
      }
    }),
    {
      name: 'aether-settings',
      getStorage: () => localStorage,
    }
  )
);