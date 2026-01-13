'use client';

import { useState, useEffect } from 'react';
import { BytebotToolExecutor } from '@/lib/services/bytebot-executor';
import { publicEnv } from '@/lib/config/publicEnv';
import { ToolCall, ToolCallResult } from '@/lib/types/chat';

export function useBytebot() {
  const [executor, setExecutor] = useState<BytebotToolExecutor | null>(null);
  const [connected, setConnected] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [fileSystemChanges, setFileSystemChanges] = useState<any[]>([]);
  const [desktopState, setDesktopState] = useState<any>(null);

  useEffect(() => {
    const executor = new BytebotToolExecutor(publicEnv.bytebotEndpoint);
    setExecutor(executor);

    // Set up listeners
    executor.onTerminalOutput((line) => {
      setTerminalOutput(prev => [...prev, line]);
    });

    executor.onFileSystemChange((change) => {
      setFileSystemChanges(prev => [...prev, change]);
    });

    executor.onDesktopState((state) => {
      setDesktopState(state);
    });

    // Update connection status
    const interval = setInterval(() => {
      setConnected(executor.isConnected());
    }, 1000);

    return () => {
      clearInterval(interval);
      executor.disconnect();
    };
  }, []);

  const executeTool = async (toolName: string, toolInput: Record<string, any>): Promise<ToolCallResult> => {
    if (!executor) {
      throw new Error('Bytebot executor not initialized');
    }
    
    return executor.executeTool(toolName, toolInput);
  };

  const executeToolCalls = async (toolCalls: ToolCall[]): Promise<ToolCallResult[]> => {
    if (!executor) {
      throw new Error('Bytebot executor not initialized');
    }
    
    const results: ToolCallResult[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        const result = await executor.executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        results.push(result);
      } catch (error) {
        results.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  };

  return {
    executor,
    connected,
    terminalOutput,
    fileSystemChanges,
    desktopState,
    executeTool,
    executeToolCalls
  };
}