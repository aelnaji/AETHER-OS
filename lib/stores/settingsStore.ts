import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { NvidiaClient } from '@/lib/api/nvidiaClient';
import { logger } from '@/lib/utils/logger';
import { secureLocalStorage } from '@/lib/utils/secureLocalStorage';

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

const SECURE_API_KEY_KEY = 'aether:nvidia_api_key';

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

Be conversational, helpful, and always explain what you're doing before executing tools.`,
};

export const NVIDIA_MODELS = [
  'meta/llama-3.1-405b-instruct',
  'mistralai/mistral-large',
  'meta/llama-3.1-70b-instruct',
  'qwen/qwen-1.5-32b-chat',
  'mistralai/mistral-7b-instruct',
];

function loadApiKey(): string {
  if (typeof window === 'undefined') return '';
  return secureLocalStorage.getItem(SECURE_API_KEY_KEY) || '';
}

function saveApiKey(value: string) {
  if (typeof window === 'undefined') return;
  if (!value) {
    secureLocalStorage.removeItem(SECURE_API_KEY_KEY);
    return;
  }
  secureLocalStorage.setItem(SECURE_API_KEY_KEY, value);
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => {
      const initialApiKey = loadApiKey();

      return {
        llmSettings: { ...DEFAULT_SETTINGS, apiKey: initialApiKey },
        isConfigured: !!initialApiKey,

        updateLLMSettings: (settings) => {
          if (settings.apiKey !== undefined) {
            saveApiKey(settings.apiKey);
          }

          set((state) => {
            const merged = {
              ...state.llmSettings,
              ...settings,
              apiKey: settings.apiKey !== undefined ? settings.apiKey : state.llmSettings.apiKey,
            };

            const isConfigured = !!merged.apiKey;
            return {
              llmSettings: merged,
              isConfigured,
            };
          });
        },

        resetToDefaults: () => {
          saveApiKey('');
          set({
            llmSettings: { ...DEFAULT_SETTINGS, apiKey: '' },
            isConfigured: false,
          });
        },

        validateSettings: async () => {
          const { llmSettings } = get();
          if (!llmSettings.apiKey) return false;
          if (!llmSettings.endpoint || !llmSettings.endpoint.startsWith('http')) return false;
          if (!llmSettings.model) return false;
          if (llmSettings.temperature < 0 || llmSettings.temperature > 1) return false;
          if (llmSettings.maxTokens < 1 || llmSettings.maxTokens > 4096) return false;
          return true;
        },

        testConnection: async () => {
          const { llmSettings } = get();
          if (!llmSettings.apiKey) return false;

          try {
            const client = new NvidiaClient(llmSettings.apiKey);
            return await client.validateApiKey();
          } catch (error) {
            logger.warn('NVIDIA connection test failed', error);
            return false;
          }
        },
      };
    },
    {
      name: 'aether-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        llmSettings: {
          ...state.llmSettings,
          apiKey: '',
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { llmSettings?: Partial<LLMSettings> };
        const merged = {
          ...currentState,
          ...persisted,
          llmSettings: {
            ...currentState.llmSettings,
            ...(persisted.llmSettings || {}),
            apiKey: currentState.llmSettings.apiKey,
          },
        };

        return {
          ...merged,
          isConfigured: !!merged.llmSettings.apiKey,
        };
      },
    }
  )
);
