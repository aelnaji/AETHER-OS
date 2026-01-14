/**
 * Simple Settings Store for AETHER-OS
 * Clean, simple settings management with real persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APISettings } from '@/lib/services/apiService';
import { testConnection } from '@/lib/services/apiService';
import { saveSettings, loadSettings } from '@/lib/services/fileService';

interface SettingsStore {
  // Settings
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  
  // State
  isConfigured: boolean;
  isLoading: boolean;
  testResult: { success: boolean; message: string } | null;
  
  // Actions
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemPrompt: (prompt: string) => void;
  testConnection: () => Promise<boolean>;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetToDefaults: () => void;
  getAPISettings: () => APISettings;
}

const DEFAULT_SETTINGS = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are A.E, a helpful AI assistant.',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_SETTINGS,
      isConfigured: false,
      isLoading: false,
      testResult: null,

      // Actions
      setBaseUrl: (url: string) => {
        set({ 
          baseUrl: url.trim(),
          isConfigured: !!(get().apiKey && url.trim()),
          testResult: null 
        });
      },

      setApiKey: (key: string) => {
        set({ 
          apiKey: key.trim(),
          isConfigured: !!(key.trim() && get().baseUrl),
          testResult: null 
        });
      },

      setTemperature: (temp: number) => {
        set({ 
          temperature: Math.max(0, Math.min(2, temp)),
          testResult: null 
        });
      },

      setMaxTokens: (tokens: number) => {
        set({ 
          maxTokens: Math.max(1, Math.min(32768, tokens)),
          testResult: null 
        });
      },

      setSystemPrompt: (prompt: string) => {
        set({ systemPrompt: prompt });
      },

      testConnection: async () => {
        const { baseUrl, apiKey } = get();
        
        if (!baseUrl || !apiKey) {
          set({ 
            testResult: { success: false, message: 'Base URL and API Key are required' }
          });
          return false;
        }

        set({ isLoading: true, testResult: null });

        try {
          const result = await testConnection(baseUrl, apiKey);
          set({ 
            testResult: result,
            isLoading: false 
          });
          return result.success;
        } catch (error) {
          const result = { 
            success: false, 
            message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
          set({ 
            testResult: result,
            isLoading: false 
          });
          return false;
        }
      },

      saveSettings: async () => {
        const { baseUrl, temperature, maxTokens, systemPrompt } = get();
        
        const settingsToSave = {
          baseUrl,
          temperature,
          maxTokens,
          systemPrompt,
        };

        try {
          await saveSettings(settingsToSave);
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      },

      loadSettings: async () => {
        set({ isLoading: true });

        try {
          const result = await loadSettings();
          if (result.success && result.data) {
            const { baseUrl, temperature, maxTokens, systemPrompt } = result.data;
            set({
              baseUrl: baseUrl || DEFAULT_SETTINGS.baseUrl,
              temperature: temperature || DEFAULT_SETTINGS.temperature,
              maxTokens: maxTokens || DEFAULT_SETTINGS.maxTokens,
              systemPrompt: systemPrompt || DEFAULT_SETTINGS.systemPrompt,
              isConfigured: !!(get().apiKey && (baseUrl || DEFAULT_SETTINGS.baseUrl)),
            });
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      resetToDefaults: () => {
        set({
          ...DEFAULT_SETTINGS,
          isConfigured: false,
          testResult: null,
        });
      },

      getAPISettings: () => {
        const { baseUrl, apiKey, temperature, maxTokens, systemPrompt } = get();
        return {
          baseUrl,
          apiKey,
          temperature,
          maxTokens,
          systemPrompt,
        };
      },
    }),
    {
      name: 'aether-simple-settings',
      getStorage: () => localStorage,
      // Only persist non-sensitive data
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        systemPrompt: state.systemPrompt,
      }),
    }
  )
);