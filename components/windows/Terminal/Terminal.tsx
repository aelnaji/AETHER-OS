'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, Send, Trash2 } from 'lucide-react';
import { useBytebot } from '@/lib/hooks/useBytebot';

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error';
  timestamp: Date;
}

export function Terminal({ onClose }: { onClose: () => void }) {
  const { connected, terminalOutput, executeTool } = useBytebot();
  const [inputValue, setInputValue] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Add terminal output from Bytebot
  useEffect(() => {
    if (terminalOutput.length > 0) {
      const newOutputs = terminalOutput.map((line, index) => ({
        id: `output-${Date.now()}-${index}`,
        content: line,
        type: 'output' as const,
        timestamp: new Date()
      }));
      
      setLines(prev => [...prev, ...newOutputs]);
    }
  }, [terminalOutput]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim() || isExecuting) return;
    
    const command = inputValue.trim();
    setInputValue('');
    setIsExecuting(true);

    // Add user input to terminal
    const inputLine: TerminalLine = {
      id: `input-${Date.now()}`,
      content: `$ ${command}`,
      type: 'input',
      timestamp: new Date()
    };
    
    setLines(prev => [...prev, inputLine]);

    try {
      // Execute command via Bytebot
      const result = await executeTool('run_command', { command });
      
      if (result.success && result.output) {
        const outputLine: TerminalLine = {
          id: `output-${Date.now()}`,
          content: result.output,
          type: 'output',
          timestamp: new Date()
        };
        setLines(prev => [...prev, outputLine]);
      }
    } catch (error) {
      const errorLine: TerminalLine = {
        id: `error-${Date.now()}`,
        content: error instanceof Error ? error.message : 'Command execution failed',
        type: 'error',
        timestamp: new Date()
      };
      setLines(prev => [...prev, errorLine]);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearTerminal = () => {
    setLines([]);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-amber-400';
      case 'output': return 'text-gray-300';
      case 'error': return 'text-red-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
              <TerminalIcon size={18} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Terminal</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearTerminal}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              title="Clear Terminal"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          <div className="space-y-1">
            {lines.length === 0 ? (
              <div className="text-gray-500">
                <p>Real Terminal - Connected to Bytebot Backend</p>
                <p className="text-xs mt-2">Type commands to execute on the actual system</p>
              </div>
            ) : (
              lines.map((line) => (
                <div key={line.id} className={`flex ${getLineColor(line.type)}`}>
                  <span className="mr-2 text-gray-500">{line.timestamp.toLocaleTimeString()}</span>
                  <span className="flex-1">{line.content}</span>
                </div>
              ))
            )}
            {isExecuting && (
              <div className="text-gray-400">
                <span className="mr-2">Executing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="px-4 py-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-400">
              {connected ? 'Connected to Bytebot Backend' : 'Disconnected - Commands will be simulated'}
            </span>
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter command..."
              disabled={isExecuting}
              className="flex-1 bg-[#0f0f0f] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isExecuting || !inputValue.trim()}
              className={`p-2 rounded-lg transition-colors ${isExecuting || !inputValue.trim() ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}