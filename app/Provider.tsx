// app/providers.tsx
'use client';
import { EcgGlobalListener } from './dashboard/vitals/_components/EcgGlobalListener';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EcgGlobalListener />
      {children}
    </>
  );
}