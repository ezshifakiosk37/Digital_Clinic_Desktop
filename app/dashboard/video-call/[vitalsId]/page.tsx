'use client'

import React from 'react';
import dynamic from 'next/dynamic';

// Now this is allowed because the parent is also a Client Component
const VideoCallClient = dynamic(() => import('./VideoCallClient'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
      <p className="text-white">Loading Video Engine...</p>
    </div>
  )
});

export default function Page({ params }: { params: Promise<{ vitalsId: string }> }) {
  // Unwrap the promise-based params for Next.js 15
  const resolvedParams = React.use(params);

  return (
    <main>
      <VideoCallClient  vitalsId={resolvedParams.vitalsId} />
    </main>
  );
}