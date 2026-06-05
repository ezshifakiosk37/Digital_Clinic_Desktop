'use client'
// In _app.tsx (or a custom provider)
import { useEffect } from 'react';

export function EcgGlobalListener() {
  useEffect(() => {
    // Define the global callback once
    window.onEcgFileDetected = (filename: string) => {
      console.log('📄 ECG file detected (global):', filename);
      // Store the filename in a global variable for later consumption
      (window as any).__lastEcgFile = filename;
      // Dispatch a custom event that any component can listen to
      window.dispatchEvent(new CustomEvent('ecg:fileDetected', { detail: filename }));
    };

    return () => {
      delete window.onEcgFileDetected;
    };
  }, []);

  return null;
}