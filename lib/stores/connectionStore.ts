import { create } from 'zustand';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStore {
  state: ConnectionState;
  connected: boolean;
  reconnectAttempts: number;
  lastError: string | null;
  lastConnectedAt: number | null;

  setState: (state: ConnectionState) => void;
  setConnected: (connected: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
  setLastError: (error: string | null) => void;
  setLastConnectedAt: (timestamp: number | null) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: 'disconnected',
  connected: false,
  reconnectAttempts: 0,
  lastError: null,
  lastConnectedAt: null,

  setState: (state) => set({ state }),
  setConnected: (connected) => set({ connected }),
  setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),
  setLastError: (lastError) => set({ lastError }),
  setLastConnectedAt: (lastConnectedAt) => set({ lastConnectedAt }),
}));
