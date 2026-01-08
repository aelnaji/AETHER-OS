const DEFAULT_KEY = 'aether-secure-secret-v1';

function getOrCreateSecret(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(DEFAULT_KEY);
    if (existing) return existing;

    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }

    const secret = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    localStorage.setItem(DEFAULT_KEY, secret);
    return secret;
  } catch {
    return '';
  }
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function xorBytes(data: Uint8Array, secret: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ secret[i % secret.length];
  }
  return out;
}

export const secureLocalStorage = {
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    const secret = getOrCreateSecret();
    if (!secret) {
      localStorage.setItem(key, value);
      return;
    }

    const data = new TextEncoder().encode(value);
    const secretBytes = new TextEncoder().encode(secret);
    const encrypted = xorBytes(data, secretBytes);
    localStorage.setItem(key, toBase64(encrypted));
  },

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const secret = getOrCreateSecret();
    if (!secret) return stored;

    try {
      const bytes = fromBase64(stored);
      const secretBytes = new TextEncoder().encode(secret);
      const decrypted = xorBytes(bytes, secretBytes);
      return new TextDecoder().decode(decrypted);
    } catch {
      return null;
    }
  },

  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
