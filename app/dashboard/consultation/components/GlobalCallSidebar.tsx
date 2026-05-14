"use client";

import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, X } from 'lucide-react';
import { AndroidBridge } from '../../../_utils/AndroidBridges/AndroidBridge';
import { apiService } from '@/app/_utils/apiService';
import { useCallQueue } from '@/app/_context/CallQueueContext';

export default function GlobalCallSidebar() {
  const { activeCall, removeCall, setActiveCall, updateCallStatus } = useCallQueue();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!activeCall) {
      stopAudio();
      return;
    }

    const wasNative = AndroidBridge.playRingtone();
    if (!wasNative) {
      const ring = new Audio('/sounds/iphone_ringtone.mp3');
      ring.loop = true;
      ring.play().catch(() => { });
      audioRef.current = ring;
    }

    return () => stopAudio();
  }, [activeCall?.vitalsId]);

  // Poll for cancellation while toast is showing
  useEffect(() => {
    if (!activeCall?.vitalsId) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiService.getCallStatus(activeCall.vitalsId);
        const status = data?.status;
        // Inside the polling useEffect
        if (status === 'declined_by_patient' || status === 'doctor_not_responding') {
          stopAudio();
          // Update the call status in the queue, don't remove it
          updateCallStatus(activeCall.vitalsId, 'not_responding');
          setActiveCall(null);   // hide the toast
        }
      } catch { }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeCall?.vitalsId]);

  const stopAudio = () => {
    AndroidBridge.stopRingtone();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const handleAccept = async () => {
    if (!activeCall) return;
    try {
      const res = await apiService.acceptCall(activeCall.vitalsId);
      if (!res.success) throw new Error("Accept failed");
      stopAudio();

      // 👇 Store patient data in context before navigation
      if (activeCall.patientId && activeCall.patientToken) {
        console.log('📦 Storing call metadata:', activeCall.vitalsId, {
          patientId: activeCall.patientId,
          patientToken: activeCall.patientToken,
        });
      } else {
        console.warn('⚠️ No patient data in activeCall cannot store metadata');
      }

      removeCall(activeCall.vitalsId);
      // Ensure callUrl is clean (no query params) – we rely on context
      window.location.href = activeCall.callUrl;
    } catch (err: any) {
      console.error("Accept error:", err.message);
      stopAudio();
      removeCall(activeCall.vitalsId);
    }
  };

  const handleDecline = async () => {
    if (!activeCall) return;
    try {
      await apiService.endCall(activeCall.vitalsId, 'declined_by_doctor');
    } catch { }
    stopAudio();
    removeCall(activeCall.vitalsId);
  };

  const handleDismissToast = () => {
    setActiveCall(null);
    stopAudio();
  };

  if (!activeCall) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-[#0297d6] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-40" />
            <div className="relative bg-white/20 rounded-full p-1.5">
              <Phone className="h-4 w-4 text-white" />
            </div>
          </div>
          <span className="text-white font-bold text-sm tracking-wide">Incoming Video Call</span>
        </div>
        <button
          onClick={handleDismissToast}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <p className="font-bold text-slate-800 text-base">{activeCall.title}</p>
        <p className="text-slate-500 text-sm mt-0.5">{activeCall.body}</p>
        {activeCall.token && (
          <p className="text-xs text-[#0297d6] font-bold mt-1">Token #{activeCall.token}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-3">
        <button
          onClick={handleDecline}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <PhoneOff size={16} />
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <Phone size={16} />
          Accept
        </button>
      </div>
    </div>
  );
}