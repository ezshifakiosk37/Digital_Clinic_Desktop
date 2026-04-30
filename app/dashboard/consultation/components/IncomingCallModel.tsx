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

  // --- Polling logic ---
  useEffect(() => {
    // Only start polling if there is an active call modal visible
    if (!call?.vitalsId) return;

    const checkCallStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/call-status/${call.vitalsId}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        const data = await res.json();

        // If the patient cancelled, the status will likely be 'idle' or 'declined'
        // Adjust these strings based on what your backend returns
        if (data.status === 'ended') {
          console.log("Call was cancelled by patient. Closing modal.");
          handleDecline()
        }
      } catch (err) {
        console.error("Polling sync error:", err);
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
      // 1. Tell the DB the doctor has accepted
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/accept-call`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure doctor is auth'd
        },
        body: JSON.stringify({ vitalsId: call.vitalsId })
      });

      // 2. Clean up audio and UI
      stopAllAudio();

      // 3. Navigate to the video room
      if (call.callUrl) {
        window.location.href = call.callUrl;
      }
      setCall(null);
    } catch (err) {
      console.error("Failed to accept call:", err);
      // Even if API fails, stop the noise
      stopAllAudio();
    }
  };

  const handleDecline = async () => {
    if (!call?.vitalsId) return;

    try {
      // Tell the DB to reset the status so the patient knows the doctor declined
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/end-call`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ vitalsId: call.vitalsId })
      });
    } catch (err) {
      console.error("Failed to decline call:", err);
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