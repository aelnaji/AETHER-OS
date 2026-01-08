'use client';

import { useEffect, useMemo, useState } from 'react';
import { BytebotToolExecutor } from '@/lib/services/bytebot-executor';
import { getBytebotSocketManager } from '@/lib/services/bytebotSocketManager';
import { useConnectionStore } from '@/lib/stores/connectionStore';
import { ToolCall, ToolCallResult } from '@/lib/types/chat';

export function useBytebot() {
  const socketManager = useMemo(() => getBytebotSocketManager(), []);
  const connected = useConnectionStore((s) => s.connected);

  const [executor] = useState(() => new BytebotToolExecutor(socketManager.socket));
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [fileSystemChanges, setFileSystemChanges] = useState<any[]>([]);
  const [desktopState, setDesktopState] = useState<any>(null);

  useEffect(() => {
    const handleTerminalOutput = (data: any) => {
      const line = typeof data === 'string' ? data : data?.output || data?.content || JSON.stringify(data);
      setTerminalOutput((prev) => [...prev, line]);
    };

    const handleFileSystemChange = (change: any) => {
      setFileSystemChanges((prev) => [...prev, change]);
    };

    const handleDesktopState = (state: any) => {
      setDesktopState(state);
    };

    socketManager.on('terminal:output', handleTerminalOutput);
    socketManager.on('filesystem:changed', handleFileSystemChange);
    socketManager.on('desktop:state', handleDesktopState);

    return () => {
      socketManager.off('terminal:output', handleTerminalOutput);
      socketManager.off('filesystem:changed', handleFileSystemChange);
      socketManager.off('desktop:state', handleDesktopState);
    };
  }, [socketManager]);

  const executeTool = async (toolName: string, toolInput: Record<string, any>): Promise<ToolCallResult> => {
    return executor.executeTool(toolName, toolInput);
  };

  const executeToolCalls = async (toolCalls: ToolCall[]): Promise<ToolCallResult[]> => {
    const results: ToolCallResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await executor.executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
        results.push(result);
      } catch (error) {
        results.push({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  };

  return {
    socket: socketManager.socket,
    socketManager,
    executor,
    connected,
    terminalOutput,
    fileSystemChanges,
    desktopState,
    executeTool,
    executeToolCalls,
  };
}
