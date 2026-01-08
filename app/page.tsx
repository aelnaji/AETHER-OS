'use client';

import React from 'react';
import { Desktop } from '@/components/Desktop';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <Desktop />
    </ErrorBoundary>
  );
}
