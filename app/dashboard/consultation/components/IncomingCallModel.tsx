"use client";

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { AndroidBridge } from '../../../_utils/AndroidBridges/AndroidBridge';
import { apiService } from '@/app/_utils/apiService';

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

  // --- Polling logic ---
  useEffect(() => {
    // Only start polling if there is an active call modal visible
    if (!call?.vitalsId) return;

    const checkCallStatus = async () => {
      try {
        const data = await apiService.getCallStatus(call.vitalsId);
        if (!data.success) throw new Error("Call Status failed!");

        const status = data?.status;

        if (status === 'declined_by_patient') {
          console.log("Call was cancelled by patient. Closing modal.");
          stopAllAudio();
          setCall(null);
        }
        else if (status === 'doctor_not_responding') {
          console.log("Doctor is not responding");
          stopAllAudio();
          setCall(null);
        }

      } catch (err: any) {
        console.error("Polling sync error:", err.message || err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(checkCallStatus, 2000);

    // Cleanup interval when call is answered, declined, or component unmounts
    return () => clearInterval(interval);
  }, [call?.vitalsId]); // Triggered whenever a call starts or ends

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

  const handleAccept = async () => {
    if (!call?.vitalsId) return;

    try {
      const res = await apiService.acceptCall(call.vitalsId);
      if (!res.success) throw new Error("Accept failed");

      stopAllAudio();

      if (call.callUrl) {
        window.location.href = call.callUrl;
      }

      setCall(null);
    } catch (err: any) {
      console.error("Failed to accept call:", err.message || err);

      // Still clean up — don’t leave UI hanging
      stopAllAudio();
      setCall(null);
    }
  };

  const handleDecline = async () => {
    if (!call?.vitalsId) return;

    try {

      const res = await apiService.endCall(call.vitalsId, 'declined_by_doctor');
      if (!res.success) throw new Error("Decline failed!");

    } catch (err: any) {
      console.error("Failed to decline call:", err.message || err);
    }

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