'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, Trash2 } from 'lucide-react';
import { useBytebot } from '@/lib/hooks/useBytebot';

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error';
  timestamp: Date;
}

export function Terminal() {
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
    <div className="flex flex-col h-full">
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#121212]">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-amber-400" />
          <span className="text-sm text-gray-400">Terminal</span>
        </div>
        <button
          onClick={clearTerminal}
          className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          title="Clear Terminal"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Terminal Content */}
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#0a0a0a]">
        <div className="space-y-1">
          {lines.length === 0 ? (
            <div className="text-gray-500">
              <p>Real Terminal - Connected to Bytebot Backend</p>
              <p className="text-xs mt-2">Type commands to execute on the actual system</p>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id} className={`flex ${getLineColor(line.type)}`}>
                <span className="mr-2 text-gray-500 shrink-0">{line.timestamp.toLocaleTimeString()}</span>
                <span className="flex-1 break-all">{line.content}</span>
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
      <div className="px-4 py-1.5 border-t border-white/10 bg-[#121212]">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-400">
            {connected ? 'Connected to Bytebot Backend' : 'Disconnected - Commands will be simulated'}
          </span>
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 bg-[#121212]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter command..."
            disabled={isExecuting}
            className="flex-1 bg-[#0a0a0a] border border-white/20 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
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
  );
}