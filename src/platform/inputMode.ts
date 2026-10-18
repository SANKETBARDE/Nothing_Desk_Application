import { useEffect, useState } from 'react';
import type { OperatingMode } from './capabilities';

/**
 * Hook to dynamically track pointer vs touch input mode and viewport dimensions.
 */
export function useInputMode() {
  const [mode, setMode] = useState<OperatingMode>(() => {
    if (typeof window === 'undefined') return 'PHONE_TOUCH';
    return window.matchMedia('(pointer: fine)').matches ? 'PHONE_POINTER' : 'PHONE_TOUCH';
  });

  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const updatePointer = (e: MediaQueryListEvent | MediaQueryList) => {
      setMode(e.matches ? 'PHONE_POINTER' : 'PHONE_TOUCH');
    };

    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    mediaQuery.addEventListener('change', updatePointer);
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', updatePointer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { mode, isLandscape, isPointer: mode === 'PHONE_POINTER' };
}
