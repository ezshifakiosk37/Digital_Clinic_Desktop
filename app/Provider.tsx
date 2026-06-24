// app/providers.tsx
'use client';
import { EcgGlobalListener } from './dashboard/vitals/_components/EcgGlobalListener';

export function Providers({ children }: { children: React.ReactNode }) {
  // Temporary debug – will be removed later
  return (
    <>
      <EcgGlobalListener />
      {children}
    </>
  );
}