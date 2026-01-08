'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import { useSettingsStore, NVIDIA_MODELS } from '@/lib/stores/settingsStore';

export function SettingsPanel() {
  const { llmSettings, updateLLMSettings, resetToDefaults, validateSettings, testConnection } = useSettingsStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const isValid = await validateSettings();
      if (!isValid) {
        setTestResult({ success: false, message: 'Invalid settings. Please check all fields.' });
        return;
      }

      const success = await testConnection();
      setTestResult({
        success,
        message: success ? 'Successfully connected to NVIDIA API!' : 'Failed to connect to NVIDIA API',
      });
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
    setTestResult({ success: true, message: 'Settings saved' });
  };

  const handleReset = () => {
    resetToDefaults();
    setTestResult(null);
    setValidationError(null);
  };

  useEffect(() => {
    const validate = async () => {
      const isValid = await validateSettings();
      setValidationError(isValid ? null : 'Some settings are invalid');
    };

    validate();
  }, [llmSettings, validateSettings]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-sm">⚙️</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <p className="text-xs text-gray-500">A.E Configuration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm transition-colors"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-4">LLM Configuration (NVIDIA API)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Endpoint URL</label>
                <div className="relative">
                  <input
                    type="text"
                    value={llmSettings.endpoint}
                    readOnly
                    className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Read-only</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">NVIDIA API endpoint</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={llmSettings.apiKey}
                    onChange={(e) => updateLLMSettings({ apiKey: e.target.value })}
                    placeholder="Enter your NVIDIA API key"
                    className={`w-full bg-[#0f0f0f] border ${
                      llmSettings.apiKey ? 'border-green-500/30' : 'border-white/20'
                    } rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-red-400">REQUIRED</span> — Get your key from{' '}
                  <a
                    href="https://build.nvidia.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline"
                  >
                    https://build.nvidia.com/
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Model</label>
                <select
                  value={llmSettings.model}
                  onChange={(e) => updateLLMSettings({ model: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none"
                >
                  {NVIDIA_MODELS.map((model) => (
                    <option key={model} value={model} className="bg-[#171717] text-gray-300">
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Available NVIDIA models</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Temperature: {llmSettings.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={llmSettings.temperature}
                  onChange={(e) => updateLLMSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-[#0f0f0f] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 ${
                      llmSettings.temperature * 100
                    }%, #374151 ${llmSettings.temperature * 100}%)`,
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Higher = more creative, lower = focused</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="4096"
                  value={llmSettings.maxTokens}
                  onChange={(e) => updateLLMSettings({ maxTokens: parseInt(e.target.value) })}
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum response length (1–4096)</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">System Prompt (Advanced)</label>
                <textarea
                  value={llmSettings.systemPrompt}
                  onChange={(e) => updateLLMSettings({ systemPrompt: e.target.value })}
                  rows={6}
                  className="w-full bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Custom system instructions for A.E</p>
              </div>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                {testResult ? (
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <AlertCircle size={16} className="text-red-400" />
                    )}
                    <span className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.message}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Not tested</span>
                )}
              </div>

              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm transition-colors"
              >
                {isTesting ? 'Testing…' : 'Test Connection'}
              </button>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{validationError}</span>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Your API key is stored locally in an encrypted form (not plain text).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
