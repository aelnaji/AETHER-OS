'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink, Save, RotateCcw } from 'lucide-react';
import { useSettingsStore, NVIDIA_MODELS } from '@/lib/stores/settingsStore';

export function SettingsPanel() {
  const { llmSettings, isConfigured, updateLLMSettings, resetToDefaults, validateSettings, testConnection } = useSettingsStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLLMSettings({ apiKey: e.target.value });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLLMSettings({ model: e.target.value });
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
        message: success ? 'Successfully connected to NVIDIA API!' : 'Failed to connect to NVIDIA API'
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
    // Settings are automatically persisted by Zustand
    onClose();
  };

  const handleReset = () => {
    resetToDefaults();
    setTestResult(null);
    setValidationError(null);
  };

  useEffect(() => {
    // Validate settings when they change
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
      <div className="bg-[#171717] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm">⚙️</span>
            </div>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
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
            {/* LLM Configuration Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">LLM Configuration (NVIDIA API)</h3>
              <div className="space-y-4">
                {/* Endpoint URL */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Endpoint URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={llmSettings.endpoint}
                      readOnly
                      className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      Read-only
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">NVIDIA API endpoint</p>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={llmSettings.apiKey}
                      onChange={handleApiKeyChange}
                      placeholder="Enter your NVIDIA API key"
                      className={`w-full bg-[#0f0f0f] border ${llmSettings.apiKey ? 'border-green-500/30' : 'border-white/20'} rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500`}
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
                    <span className="text-red-400">REQUIRED</span> - Get your key from: <a href="https://build.nvidia.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">https://build.nvidia.com/</a>
                  </p>
                </div>

                {/* Model Selector */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Model</label>
                  <select
                    value={llmSettings.model}
                    onChange={handleModelChange}
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none"
                  >
                    {NVIDIA_MODELS.map((model) => (
                      <option key={model} value={model} className="bg-[#171717] text-gray-300">
                        {model}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Available NVIDIA models</p>
                  <div className="mt-2 text-xs text-gray-400 space-y-1">
                    <div>• Llama 3.1 405B (recommended)</div>
                    <div>• Mistral Large</div>
                    <div>• Llama 3.1 70B</div>
                    <div>• Qwen 1.5 32B Chat</div>
                    <div>• Mistral 7B</div>
                  </div>
                </div>

                {/* Temperature Slider */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Temperature: {llmSettings.temperature.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={llmSettings.temperature}
                    onChange={handleTemperatureChange}
                    className="w-full h-2 bg-[#0f0f0f] rounded-lg appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, #10b981 ${llmSettings.temperature * 100}%, #374151 ${llmSettings.temperature * 100}%)` }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher = more creative, lower = focused</p>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    value={llmSettings.maxTokens}
                    onChange={handleMaxTokensChange}
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum response length (1-4096)</p>
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
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !llmSettings.apiKey}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${llmSettings.apiKey ? 'bg-[#0f0f0f] hover:bg-white/10 text-gray-300 border border-white/20' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-[#0f0f0f] hover:bg-white/10 text-gray-300 border border-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={!isConfigured || !!validationError}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${isConfigured && !validationError ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  <Save size={16} />
                  Save Settings
                </button>
              </div>

              {/* Info Note */}
              <div className="text-xs text-gray-500 bg-[#0f0f0f] border border-white/10 rounded-lg p-3">
                <p>ℹ️ Note: Settings are saved locally and never shared with Bytebot backend.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}