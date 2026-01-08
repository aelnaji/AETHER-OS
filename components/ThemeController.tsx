'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';

export function ThemeController() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
