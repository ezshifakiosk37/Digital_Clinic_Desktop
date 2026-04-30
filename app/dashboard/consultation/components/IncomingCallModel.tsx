// components/IncomingCallModal.tsx
"use client";

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';

interface CallPayload {
  vitalsId: string;
  title: string;
  body: string;
  callUrl: string;
}

export default function IncomingCallModal() {
  const [call, setCall] = useState<CallPayload | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as CallPayload;
      setCall(detail);

      // Audio must be created after user interaction — the layout has been
      // interacted with by the time a call comes in, so this should work
      const ring = new Audio('/sounds/incoming-call1.mp3');
      ring.loop = true;
      ring.play().catch(console.error);
      setAudio(ring);
    };

    window.addEventListener('incoming-call', handler);
    return () => window.removeEventListener('incoming-call', handler);
  }, []);

  const handleAccept = () => {
    audio?.pause();
    setAudio(null);
    if (call?.callUrl) {
      window.location.href = call.callUrl;
    }
    setCall(null);
  };

  const handleDecline = () => {
    audio?.pause();
    setAudio(null);
    setCall(null);
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-6 animate-pulse-once">
        
        {/* Pulsing avatar */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30" />
          <div className="relative bg-blue-100 rounded-full p-6">
            <Phone className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">{call.title}</h2>
          <p className="text-slate-500 text-sm mt-1">{call.body}</p>
        </div>

        <div className="flex gap-6">
          {/* Decline */}
          <button
            onClick={handleDecline}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          {/* Accept */}
          <button
            onClick={handleAccept}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg shadow-green-200 transition-all active:scale-95"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>

        <p className="text-xs text-slate-400">Tap green to join the call</p>
      </div>
    </div>
  );
}