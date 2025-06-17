'use client';

import { useEffect } from 'react';
import { initScrollSystem, destroyScrollSystem } from '@/lib/scrollSystem';

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initScrollSystem();
    return () => destroyScrollSystem();
  }, []);

  return <>{children}</>;
}
