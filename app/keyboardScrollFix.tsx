'use client'; // Must be a client component

import { useEffect } from 'react';

export function KeyboardScrollFix() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    let timeout: NodeJS.Timeout;

    const handleResize = () => {
      const viewport = window.visualViewport!;
      const diff = window.innerHeight - viewport.height;
      
      // If keyboard is open (diff > 100px)
      if (diff > 100) {
        // Wait 50ms for the keyboard animation to settle
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const activeElement = document.activeElement;
          // If an input/textarea is focused, scroll it into view smoothly
          if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  return null; // This component does nothing visually
}