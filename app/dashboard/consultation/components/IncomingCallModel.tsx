"use client";

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { AndroidBridge } from '../../../_utils/AndroidBridges/AndroidBridge'; 

interface CallPayload {
  vitalsId: string;
  title: string;
  body: string;
  callUrl: string;
}

export default function IncomingCallModal() {
  const [call, setCall] = useState<CallPayload | null>(null);
  // We keep this state for the WEB fallback only
  const [webAudio, setWebAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as CallPayload;
      setCall(detail);

      // 1. Try Native First
      const wasNativeTriggered = AndroidBridge.playRingtone();

      // 2. Fallback to Web Audio only if Native failed/not found
      if (!wasNativeTriggered) {
        console.log("Native bridge not found. Falling back to Web Audio.");
        const ring = new Audio('/sounds/iphone_ringtone.mp3');
        ring.loop = true;
        ring.play().catch((err) => console.warn("Web Audio Playback failed:", err));
        setWebAudio(ring);
      }
    };

    window.addEventListener('incoming-call', handler);
    return () => {
      window.removeEventListener('incoming-call', handler);
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
    // Stop Native
    AndroidBridge.stopRingtone();
    
    // Stop Web Fallback
    if (webAudio) {
      webAudio.pause();
      webAudio.currentTime = 0; // Reset for next time
      setWebAudio(null);
    }
  };

  const handleAccept = () => {
    stopAllAudio();
    if (call?.callUrl) {
      window.location.href = call.callUrl;
    }
    setCall(null);
  };

  const handleDecline = () => {
    stopAllAudio();
    setCall(null);
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* ... UI remains the same ... */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-6 animate-pulse-once">
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
          <button onClick={handleDecline} className="bg-red-500 text-white rounded-full p-4"><PhoneOff /></button>
          <button onClick={handleAccept} className="bg-green-500 text-white rounded-full p-4"><Phone /></button>
        </div>
      </div>
    </div>
  );
}