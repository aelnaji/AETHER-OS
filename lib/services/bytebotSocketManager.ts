import { io, Socket } from 'socket.io-client';
import { useConnectionStore } from '@/lib/stores/connectionStore';
import { logger } from '@/lib/utils/logger';

interface QueuedEmit {
  event: string;
  args: unknown[];
  queuedAt: number;
}

export class BytebotSocketManager {
  public readonly socket: Socket;
  private queue: QueuedEmit[] = [];
  private maxQueueSize = 250;

  constructor(endpoint: string) {
    this.socket = io(endpoint, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      timeout: 20_000,
    });

    this.socket.on('connect', () => {
      const store = useConnectionStore.getState();
      store.setState('connected');
      store.setConnected(true);
      store.setLastError(null);
      store.setReconnectAttempts(0);
      store.setLastConnectedAt(Date.now());

      this.flushQueue();
    });

    this.socket.on('disconnect', () => {
      const store = useConnectionStore.getState();
      store.setState('disconnected');
      store.setConnected(false);
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      const store = useConnectionStore.getState();
      store.setState('connecting');
      store.setReconnectAttempts(attempt);
    });

    this.socket.on('connect_error', (err) => {
      const store = useConnectionStore.getState();
      store.setState('error');
      store.setConnected(false);
      store.setLastError(err?.message ?? 'Connection error');
      logger.warn('Bytebot socket connect_error', err);
    });

    this.socket.on('error', (err) => {
      const store = useConnectionStore.getState();
      store.setLastError(typeof err === 'string' ? err : err?.message ?? 'Socket error');
      logger.warn('Bytebot socket error', err);
    });
  }

  on: Socket['on'] = (...args) => this.socket.on(...args);
  off: Socket['off'] = (...args) => this.socket.off(...args);

  emit(event: string, ...args: unknown[]) {
    if (this.socket.connected) {
      this.socket.emit(event, ...(args as any));
      return;
    }

    this.queue.push({ event, args, queuedAt: Date.now() });
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }
  }

  private flushQueue() {
    if (!this.socket.connected || this.queue.length === 0) return;

    const queue = [...this.queue];
    this.queue = [];

    for (const item of queue) {
      this.socket.emit(item.event, ...(item.args as any));
    }
  }

  disconnect() {
    this.socket.disconnect();
  }
}

let singleton: BytebotSocketManager | null = null;

export function getBytebotSocketManager(): BytebotSocketManager {
  if (singleton) return singleton;

  const endpoint =
    process.env.NEXT_PUBLIC_BYTEBOT_ENDPOINT ||
    // eslint-disable-next-line no-restricted-globals
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');

  singleton = new BytebotSocketManager(endpoint);
  return singleton;
}
