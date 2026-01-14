'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuickyAI } from '@/lib/hooks/useQuickyAI';
import {
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Video,
  ScanLine,
  Settings,
  Sparkles,
  Send,
  Loader2,
  X,
  Download,
  Bookmark,
  ChevronDown,
  Clock,
  DollarSign,
} from 'lucide-react';
import { AIModel, AIConversation } from '@/lib/types/ai';

export interface QuickyAIProps {
  windowId?: string;
  onClose?: () => void;
}

type TabType = 'chat' | 'image' | 'voice' | 'video' | 'ocr';

export function QuickyAI({ windowId, onClose }: QuickyAIProps) {
  const {
    models,
    modelGroups,
    isLoadingModels,
    conversations,
    currentConversation,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    exportConversation,
    sendMessage,
    isProcessing,
    activities,
    currentActivity,
    settings,
    updateSettings,
    generateImage,
    analyzeImage,
    textToSpeech,
    speechToText,
    generateVideo,
  } = useQuickyAI();

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConversations, setShowConversations] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set default model when models load
  useEffect(() => {
    if (!isLoadingModels && models.length > 0 && !selectedModel) {
      const defaultModel = settings.defaultChatModel || models[0]?.id;
      setSelectedModel(defaultModel);
      
      if (!currentConversation) {
        createConversation(defaultModel);
      }
    }
  }, [isLoadingModels, models, selectedModel, settings.defaultChatModel, currentConversation, createConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentConversation || isProcessing) return;

    const message = inputValue;
    setInputValue('');

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelSelector(false);
    
    // Create new conversation with selected model
    const model = models.find((m) => m.id === modelId);
    if (model) {
      createConversation(modelId, `Chat with ${model.name}`);
    }
  };

  const handleNewConversation = () => {
    if (selectedModel) {
      createConversation(selectedModel);
    }
  };

  const selectedModelObj = models.find((m) => m.id === selectedModel);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'image', label: 'Image Gen', icon: ImageIcon },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'ocr', label: 'OCR', icon: ScanLine },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Quicky AI</h2>
            <p className="text-xs text-gray-500">Multi-Model AI Interface</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10 bg-[#141414]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations */}
        {activeTab === 'chat' && showConversations && (
          <div className="w-64 border-r border-white/10 flex flex-col bg-[#141414]">
            <div className="p-3 border-b border-white/10">
              <button
                onClick={handleNewConversation}
                className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors"
              >
                + New Conversation
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setCurrentConversation(conv)}
                  className={`p-3 border-b border-white/5 cursor-pointer transition-colors ${
                    currentConversation?.id === conv.id
                      ? 'bg-purple-500/10 border-l-2 border-l-purple-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {conv.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Model Selector */}
          <div className="p-3 border-b border-white/10 bg-[#141414]">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-lg text-sm text-white transition-colors"
                  disabled={isLoadingModels}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span>
                      {isLoadingModels
                        ? 'Loading models...'
                        : selectedModelObj
                        ? selectedModelObj.name
                        : 'Select Model'}
                    </span>
                  </div>
                  <ChevronDown size={16} />
                </button>

                {/* Model Dropdown */}
                {showModelSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {modelGroups.map((group) => (
                      <div key={group.provider} className="border-b border-white/5 last:border-0">
                        <div className="px-4 py-2 bg-[#141414] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {group.provider} ({group.count})
                        </div>
                        {group.models.map((model: AIModel) => (
                          <button
                            key={model.id}
                            onClick={() => handleModelChange(model.id)}
                            className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white">
                                  {model.name}
                                </div>
                                {model.description && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    {model.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {model.contextLength && (
                                    <span className="text-xs text-gray-600">
                                      {(model.contextLength / 1000).toFixed(0)}K ctx
                                    </span>
                                  )}
                                  {model.capabilities.slice(0, 3).map((cap) => (
                                    <span
                                      key={cap}
                                      className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {model.pricing && (
                                <div className="text-xs text-gray-600">
                                  <DollarSign size={10} className="inline" />
                                  {model.pricing.inputTokens?.toFixed(4)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {currentConversation && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportConversation(currentConversation, 'md')}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Export conversation"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Content */}
          {activeTab === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!currentConversation || currentConversation.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto">
                        <Sparkles size={32} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Welcome to Quicky AI
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Access 500+ AI models from OpenAI, Anthropic, Google, xAI, and more.
                          Start a conversation or try other AI features.
                        </p>
                      </div>
                      {selectedModelObj && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                          <p className="text-xs text-purple-300">
                            <strong>Current Model:</strong> {selectedModelObj.name}
                          </p>
                          {selectedModelObj.description && (
                            <p className="text-xs text-gray-400 mt-1">
                              {selectedModelObj.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-purple-500/20 border border-purple-500/30'
                              : 'bg-[#1a1a1a] border border-white/10'
                          }`}
                        >
                          <div className="text-sm text-white whitespace-pre-wrap">
                            {message.content || (
                              <span className="text-gray-500 italic">Generating...</span>
                            )}
                          </div>
                          {message.error && (
                            <div className="mt-2 text-xs text-red-400">
                              Error: {message.error}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                            {message.tokens && (
                              <span>{message.tokens.total} tokens</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-[#141414]">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        selectedModelObj
                          ? `Message ${selectedModelObj.name}...`
                          : 'Select a model to start chatting...'
                      }
                      disabled={!selectedModelObj || isProcessing}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || !selectedModelObj || isProcessing}
                    className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
                {currentActivity && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <Clock size={12} />
                    <span>
                      {currentActivity.status === 'processing'
                        ? `Processing with ${currentActivity.model}...`
                        : `Last: ${currentActivity.model} - ${currentActivity.status}`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Other Tabs */}
          {activeTab === 'image' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
                  <ImageIcon size={32} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Image Generation</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Generate images using DALL-E, Stable Diffusion, and other models.
                  Coming soon!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mx-auto">
                  <Mic size={32} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Voice Features</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Text-to-speech, speech-to-text, and voice changing.
                  Coming soon!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto">
                  <Video size={32} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Video Generation</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Generate videos using Sora and other models.
                  Coming soon!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mx-auto">
                  <ScanLine size={32} className="text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Image Analysis & OCR</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Analyze images, extract text, and use vision models.
                  Coming soon!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
