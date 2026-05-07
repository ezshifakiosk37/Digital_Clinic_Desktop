'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const VideoCallClient = dynamic(() => import('./VideoCallClient'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
      <p className="text-white">Loading Video Engine...</p>
    </div>
  )
});

export default function Page({ params }: { params: Promise<{ vitalsId: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();

  const patientId    = searchParams.get('patientId')    ?? undefined;
  const patientToken = searchParams.get('patientToken') ?? undefined;

  return (
    <main>
      <VideoCallClient
        vitalsId={resolvedParams.vitalsId}
        patientId={patientId}
        patientToken={patientToken}
      />
    </main>
  );
}