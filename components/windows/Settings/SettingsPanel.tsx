'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye, EyeOff, Save, RotateCcw, X } from 'lucide-react';
import { useSettingsStore } from '@/lib/stores/settingsStore';

export interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    baseUrl,
    apiKey,
    temperature,
    maxTokens,
    systemPrompt,
    isConfigured,
    isLoading,
    testResult,
    setBaseUrl,
    setApiKey,
    setTemperature,
    setMaxTokens,
    setSystemPrompt,
    testConnection,
    saveSettings,
    resetToDefaults,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  useEffect(() => {
    setLocalBaseUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setLocalBaseUrl(url);
    setBaseUrl(url);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setLocalApiKey(key);
    setApiKey(key);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTemperature(value);
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setMaxTokens(value);
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value);
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  const handleSave = async () => {
    await saveSettings();
    onClose();
  };

  const handleReset = () => {
    resetToDefaults();
    setLocalBaseUrl('');
    setLocalApiKey('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm">⚙️</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <p className="text-xs text-gray-500">API Configuration</p>
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
            {/* API Configuration */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">API Configuration</h3>
              
              {/* Base URL */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">Base URL</label>
                <input
                  type="text"
                  value={localBaseUrl}
                  onChange={handleBaseUrlChange}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500">Hint: OpenAI, custom, or local endpoint</p>
              </div>

              {/* API Key */}
              <div className="space-y-2 mt-4">
                <label className="block text-sm text-gray-400">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Enter your API key"
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 pr-10 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Hide/Show toggle for security</p>
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-4">Advanced Settings</h3>
              
              {/* Temperature */}
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={handleTemperatureChange}
                  className="w-full h-2 bg-[#0f0f0f] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 ${(temperature / 2) * 100}%, #374151 ${(temperature / 2) * 100}%)`,
                  }}
                />
                <p className="text-xs text-gray-500">Higher = more creative, lower = more focused (0-2)</p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2 mt-4">
                <label className="block text-sm text-gray-400">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="32768"
                  value={maxTokens}
                  onChange={handleMaxTokensChange}
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2.5 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500">Maximum response length (1-32768)</p>
              </div>

              {/* System Prompt */}
              <div className="space-y-2 mt-4">
                <label className="block text-sm text-gray-400">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={handleSystemPromptChange}
                  rows={4}
                  placeholder="You are A.E, a helpful AI assistant."
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                />
                <p className="text-xs text-gray-500">Custom instructions for the AI</p>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                {testResult ? (
                  <div className="flex items-center gap-1">
                    {testResult.success ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertCircle size={16} className="text-red-400" />
                    )}
                    <span className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.success ? 'Connected' : testResult.message}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Not tested</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={isLoading || !localBaseUrl || !localApiKey}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  localBaseUrl && localApiKey
                    ? 'bg-[#0f0f0f] hover:bg-white/10 text-gray-300 border border-white/20'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-[#0f0f0f] hover:bg-white/10 text-gray-300 border border-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!isConfigured}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isConfigured
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                Save
              </button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 bg-[#0f0f0f] border border-white/10 rounded-lg p-3">
              <p>ℹ️ Settings are saved locally and never shared. API keys are not stored in browser storage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
