'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye, EyeOff, Save, RotateCcw, X, Info, Globe } from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { AI_PROVIDERS, getProvider } from '@/lib/constants/aiProviders';

export interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    llmSettings,
    isConfigured,
    availableModels,
    updateLLMSettings,
    updateProvider,
    resetToDefaults,
    validateSettings,
    testConnection,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [customEndpoint, setCustomEndpoint] = useState(llmSettings.endpoint);
  const [customModel, setCustomModel] = useState('');

  const selectedProvider = getProvider(llmSettings.provider);
  const isCustomProvider = llmSettings.provider === 'custom';

  useEffect(() => {
    setCustomEndpoint(llmSettings.endpoint);
  }, [llmSettings.endpoint, llmSettings.provider]);

  const handleProviderChange = (providerId: string) => {
    updateProvider(providerId);
    const provider = getProvider(providerId);
    if (provider) {
      setCustomEndpoint(provider.endpoint);
      updateLLMSettings({ endpoint: provider.endpoint });
    }
    setTestResult(null);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLLMSettings({ apiKey: e.target.value });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLLMSettings({ model: e.target.value });
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const model = e.target.value;
    setCustomModel(model);
    updateLLMSettings({ model });
  };

  const handleCustomEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endpoint = e.target.value;
    setCustomEndpoint(endpoint);
    updateLLMSettings({ endpoint });
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateLLMSettings({ temperature: value });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateLLMSettings({ maxTokens: value });
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateLLMSettings({ systemPrompt: e.target.value });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const isValid = await validateSettings();
      if (!isValid) {
        setTestResult({ success: false, message: 'Invalid settings. Please check all fields.' });
        setIsTesting(false);
        return;
      }

      const success = await testConnection();
      setTestResult({
        success,
        message: success
          ? `Successfully connected to ${selectedProvider?.name || 'API'}!`
          : `Failed to connect to ${selectedProvider?.name || 'API'}`,
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    const isValid = await validateSettings();
    if (!isValid) {
      setValidationError('Please fix validation errors before saving');
      return;
    }

    setValidationError(null);
    onClose();
  };

  const handleReset = () => {
    resetToDefaults();
    setTestResult(null);
    setValidationError(null);
    setCustomModel('');
  };

  useEffect(() => {
    const validate = async () => {
      const isValid = await validateSettings();
      if (!isValid) {
        setValidationError('Some settings are invalid');
      } else {
        setValidationError(null);
      }
    };

    validate();
  }, [llmSettings, validateSettings]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm">⚙️</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-xs text-gray-500">AI Provider Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* AI Provider Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">AI Provider</h3>
              <div className="space-y-4">
                {/* Provider Dropdown */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Provider</label>
                  <select
                    value={llmSettings.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none cursor-pointer"
                  >
                    {Object.values(AI_PROVIDERS).map((provider) => (
                      <option key={provider.id} value={provider.id} className="bg-[#171717] text-gray-300">
                        {provider.icon} {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provider Info */}
                {selectedProvider && selectedProvider.documentationUrl && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                    <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-300">
                        Get your API key from{' '}
                        <a
                          href={selectedProvider.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:underline"
                        >
                          {selectedProvider.documentationUrl}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Custom Endpoint (for all providers) */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    API Endpoint
                    <span className="text-xs text-gray-500 ml-2">
                      {isCustomProvider ? '(Required for custom)' : '(Override default)'}
                    </span>
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={customEndpoint}
                      onChange={handleCustomEndpointChange}
                      placeholder={isCustomProvider ? 'https://your-api-endpoint.com/v1/chat/completions' : ''}
                      className={`w-full bg-[#0f0f0f] border ${customEndpoint ? 'border-green-500/30' : 'border-white/20'} rounded-lg pl-10 pr-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isCustomProvider
                      ? 'Enter the full API endpoint URL for your custom provider'
                      : `Override the default ${selectedProvider?.name} endpoint (optional)`}
                  </p>
                </div>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={llmSettings.apiKey}
                  onChange={handleApiKeyChange}
                  placeholder={isCustomProvider ? 'Enter your API key' : `Enter your ${selectedProvider?.name} API key`}
                  className={`w-full bg-[#0f0f0f] border ${llmSettings.apiKey ? 'border-green-500/30' : 'border-white/20'} rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isCustomProvider ? (
                  <span className="text-amber-400">REQUIRED</span>
                ) : (
                  <span className="text-red-400">REQUIRED</span>
                )}{' '}
                - Your API key is stored locally and never shared
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Model</label>
              {isCustomProvider ? (
                <input
                  type="text"
                  value={customModel || llmSettings.model}
                  onChange={handleCustomModelChange}
                  placeholder="Enter model name (e.g., gpt-4, llama-2-70b)"
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              ) : (
                <select
                  value={llmSettings.model}
                  onChange={handleModelChange}
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none cursor-pointer"
                >
                  {availableModels.length > 0 ? (
                    availableModels.map((model) => (
                      <option key={model} value={model} className="bg-[#171717] text-gray-300">
                        {model}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-[#171717] text-gray-300">
                      No models available
                    </option>
                  )}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {isCustomProvider ? 'Enter the model identifier' : `Available ${selectedProvider?.name} models`}
              </p>
              {!isCustomProvider && availableModels.length > 0 && (
                <div className="mt-2 text-xs text-gray-400 max-h-24 overflow-y-auto">
                  {availableModels.slice(0, 5).map((model) => (
                    <div key={model} className="truncate">
                      • {model}
                    </div>
                  ))}
                  {availableModels.length > 5 && (
                    <div className="text-gray-500">... and {availableModels.length - 5} more</div>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">Advanced Settings</h3>
              <div className="space-y-4">
                {/* Temperature Slider */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Temperature: {llmSettings.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={llmSettings.temperature}
                    onChange={handleTemperatureChange}
                    className="w-full h-2 bg-[#0f0f0f] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 ${(llmSettings.temperature / 2) * 100}%, #374151 ${(llmSettings.temperature / 2) * 100}%)`,
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = more creative, lower = more focused (0-2)
                  </p>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    max="32768"
                    value={llmSettings.maxTokens}
                    onChange={handleMaxTokensChange}
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum response length (1-32768)</p>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">System Prompt (Advanced)</label>
                  <textarea
                    value={llmSettings.systemPrompt}
                    onChange={handleSystemPromptChange}
                    rows={6}
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Custom system instructions for A.E</p>
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                {testResult && (
                  <div className="flex items-center gap-1">
                    {testResult.success ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertCircle size={16} className="text-red-400" />
                    )}
                    <span className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.success ? 'Connected' : 'Failed'}
                    </span>
                  </div>
                )}
                {!testResult && <span className="text-sm text-gray-500">Not tested</span>}
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  <AlertCircle size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !llmSettings.apiKey}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    llmSettings.apiKey
                      ? 'bg-[#0f0f0f] hover:bg-white/10 text-gray-300 border border-white/20'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-[#0f0f0f] hover:bg-white/10 text-gray-300 border border-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={!isConfigured || !!validationError}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isConfigured && !validationError
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save size={16} />
                  Save Settings
                </button>
              </div>

              {/* Info Note */}
              <div className="text-xs text-gray-500 bg-[#0f0f0f] border border-white/10 rounded-lg p-3">
                <p>ℹ️ Note: Settings are saved locally in your browser and never shared with the backend.</p>
                {selectedProvider && (
                  <p className="mt-1">
                    📡 Using {selectedProvider.name} {selectedProvider.supportsStreaming ? '(Streaming)' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
