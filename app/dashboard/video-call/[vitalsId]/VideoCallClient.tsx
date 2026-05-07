'use client';

import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  ILocalVideoTrack,
  ILocalAudioTrack,
  IAgoraRTCClient
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Loader2,
  CameraOff, AlertCircle, ClipboardList
} from "lucide-react";
import { apiService } from '@/app/_utils/apiService';
import { PrescriptionModal } from './PrescriptionModel';
import { useCallData } from '@/app/_context/CallDataContext';

interface VideoCallClientProps {
  vitalsId: string;
  // ❌ patientId and patientToken removed – now only from context
}

export default function VideoCallClient({ vitalsId }: VideoCallClientProps) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);

  // State for patient data – will be populated from context or sessionStorage
  const [patientId, setPatientId] = useState<string | undefined>();
  const [patientToken, setPatientToken] = useState<string | undefined>();

  const client = useRef<IAgoraRTCClient | null>(null);
  const initialized = useRef(false);
  const localAudioTrack = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrack = useRef<ILocalVideoTrack | null>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);

  const { getCallMetadata, clearCallMetadata } = useCallData();

  // Load patient data from context (or fallback to sessionStorage)
  useEffect(() => {
    const loadPatientData = () => {
      // 1. Try context first
      const metadata = getCallMetadata(vitalsId);
      if (metadata?.patientId && metadata?.patientToken) {
        console.log('✅ Using patient data from context', metadata);
        setPatientId(metadata.patientId);
        setPatientToken(metadata.patientToken);
        // Clean up context after reading
        clearCallMetadata(vitalsId);
        // Backup to sessionStorage for page refresh
        sessionStorage.setItem(`call_${vitalsId}`, JSON.stringify({
          patientId: metadata.patientId,
          patientToken: metadata.patientToken,
        }));
        return;
      }

      // 2. Fallback to sessionStorage (e.g., after page refresh)
      const stored = sessionStorage.getItem(`call_${vitalsId}`);
      if (stored) {
        try {
          const { patientId: storedId, patientToken: storedToken } = JSON.parse(stored);
          if (storedId && storedToken) {
            console.log('✅ Using patient data from sessionStorage (refresh recovery)');
            setPatientId(storedId);
            setPatientToken(storedToken);
            return;
          }
        } catch (err) {
          console.error('Failed to parse sessionStorage data', err);
        }
      }

      console.warn('⚠️ No patient data found for vitalsId:', vitalsId);
    };

    loadPatientData();
  }, [vitalsId, getCallMetadata, clearCallMetadata]);

  // Clean up sessionStorage when call ends (delayed to allow refresh)
  useEffect(() => {
    return () => {
      setTimeout(() => {
        sessionStorage.removeItem(`call_${vitalsId}`);
      }, 5000);
    };
  }, [vitalsId]);

  // (rest of your Agora logic unchanged)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initCall = async () => {
      try {
        const authToken = localStorage.getItem('doc_token') || localStorage.getItem('token');
        if (!authToken) throw new Error("No auth token found. Please log in again.");

        const data = await apiService.getAgoraToken(vitalsId);
        if (!data.success) throw new Error(data.error || "Token fetch failed");

        client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        await client.current.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          vitalsId,
          data.token,
          data.uid
        );

        client.current.on("user-published", async (user, mediaType) => {
          try {
            await client.current!.subscribe(user, mediaType);
            if (mediaType === "video" && remoteRef.current) {
              user.videoTrack?.play(remoteRef.current);
            }
            if (mediaType === "audio") {
              user.audioTrack?.play();
            }
          } catch (subErr) {
            console.error("Subscription failed:", subErr);
          }
        });

        client.current.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video" && remoteRef.current) {
            remoteRef.current.innerHTML = '';
          }
        });

        try {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localAudioTrack.current = audioTrack;
          localVideoTrack.current = videoTrack;

          if (localRef.current) videoTrack.play(localRef.current);

          await client.current.publish([audioTrack, videoTrack]);
          setHasCamera(true);
        } catch (deviceErr: any) {
          console.warn("Camera/mic failed:", deviceErr.code);
          if (
            deviceErr.code === 'PERMISSION_DENIED' ||
            deviceErr.message?.includes('Permission denied') ||
            deviceErr.message?.includes('NotAllowedError')
          ) {
            setPermissionDenied(true);
            setHasCamera(false);
            setJoined(true);
            setLoading(false);
            return;
          }

          if (
            deviceErr.code === 'DEVICE_NOT_FOUND' ||
            deviceErr.message?.includes('NotFoundError')
          ) {
            try {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              localAudioTrack.current = audioTrack;
              await client.current!.publish([audioTrack]);
              setHasCamera(false);
            } catch {
              console.warn("No audio device — joined as listener");
              setHasCamera(false);
            }
          }
        }

        setJoined(true);
      } catch (err: any) {
        console.error("Video Call Error:", err);
        setError(err.message || "Failed to join call");
      } finally {
        setLoading(false);
      }
    };

    initCall();

    return () => {
      localAudioTrack.current?.stop();
      localAudioTrack.current?.close();
      localAudioTrack.current = null;
      localVideoTrack.current?.stop();
      localVideoTrack.current?.close();
      localVideoTrack.current = null;
      client.current?.leave();
      client.current = null;
    };
  }, [vitalsId]);

  const handleEndCall = () => {
    sessionStorage.removeItem(`call_${vitalsId}`);
    localAudioTrack.current?.stop();
    localAudioTrack.current?.close();
    localVideoTrack.current?.stop();
    localVideoTrack.current?.close();
    client.current?.leave();
    const isDoctor = !!localStorage.getItem('doc_token');
    window.location.href = isDoctor ? '/dashboard/consultation' : '/dashboard/vitals';
  };

  if (error) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 font-medium text-center">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} variant="secondary">Retry</Button>
          <Button onClick={handleEndCall} variant="destructive">Leave</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
      {/* Prescription Modal */}
      {isPrescriptionOpen && (
        <>
          {console.log('📋 Opening PrescriptionModal with:', { patientId, patientToken })}
          <PrescriptionModal
            onClose={() => setIsPrescriptionOpen(false)}
            patientId={patientId}
            patientToken={patientToken}
          />
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="z-50 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-white font-medium">Initializing secure connection...</p>
        </div>
      )}

      {/* Permission denied banner */}
      {permissionDenied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-500/90 text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          Camera & microphone blocked. Click the lock icon in your browser address bar to allow access, then reload.
        </div>
      )}

      {/* Remote video */}
      <div ref={remoteRef} className="absolute inset-0 w-full h-full bg-slate-900" />

      {/* Local video PiP */}
      {hasCamera ? (
        <div ref={localRef} className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-black rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10" />
      ) : (
        <div className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-slate-800 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10 flex items-center justify-center">
          <CameraOff className="h-8 w-8 text-slate-400" />
        </div>
      )}

      {/* Controls */}
      {joined && (
        <div className="absolute bottom-10 flex items-center gap-4 z-20">
          <Button
            onClick={async () => {
              if (localAudioTrack.current) {
                await localAudioTrack.current.setEnabled(!micOn);
                setMicOn(!micOn);
              }
            }}
            variant={micOn ? "secondary" : "destructive"}
            className="rounded-full h-14 w-14"
            disabled={!localAudioTrack.current}
          >
            {micOn ? <Mic /> : <MicOff />}
          </Button>

          <Button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 rounded-full h-16 w-16"
          >
            <PhoneOff className="text-white" />
          </Button>

          <Button
            onClick={async () => {
              if (localVideoTrack.current) {
                await localVideoTrack.current.setEnabled(!videoOn);
                setVideoOn(!videoOn);
              }
            }}
            variant={videoOn ? "secondary" : "destructive"}
            className="rounded-full h-14 w-14"
            disabled={!localVideoTrack.current}
          >
            {videoOn ? <Video /> : <VideoOff />}
          </Button>

          <Button
            onClick={() => setIsPrescriptionOpen(true)}
            className="rounded-full h-14 w-14 bg-[#0297d6] hover:bg-[#0288c2] text-white shadow-lg shadow-[#0297d6]/40 border-2 border-white/20 transition-all active:scale-95"
            title="Write Prescription"
          >
            <ClipboardList size={20} />
          </Button>
        </div>
      )}
    </div>
  );
}