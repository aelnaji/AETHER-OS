'use client';

import { SettingsPanel } from './SettingsPanel';

export function Settings({ onClose }: { onClose: () => void }) {
  return <SettingsPanel onClose={onClose} />;
}