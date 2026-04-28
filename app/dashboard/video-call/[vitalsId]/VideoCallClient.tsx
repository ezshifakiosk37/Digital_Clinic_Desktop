'use client'

import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, { ILocalVideoTrack, ILocalAudioTrack, IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";

export default function VideoCallClient({ vitalsId }: { vitalsId: string }) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const client = useRef<IAgoraRTCClient | null>(null);
  const localTracks = useRef<(ILocalAudioTrack | ILocalVideoTrack)[]>([]);
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const baseUrl = "https://bifurcation-clinic-api.vercel.app";
        const tokenResponse = await fetch(`${baseUrl}/api/agoravideo/token/${vitalsId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        const data = await tokenResponse.json();
        if (!data.success) throw new Error(data.error || "Token fetch failed");

        client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        client.current.on("user-published", async (user, mediaType) => {
          await client.current!.subscribe(user, mediaType);
          if (mediaType === "video") user.videoTrack?.play(remoteRef.current!);
          if (mediaType === "audio") user.audioTrack?.play();
        });

        await client.current.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          vitalsId,
          data.token,
          data.uid
        );

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracks.current = [audioTrack, videoTrack];

        videoTrack.play(localRef.current!);
        await client.current.publish(localTracks.current);

        setJoined(true);
      } catch (err) {
        console.error("Video Call Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initCall();

    return () => {
      localTracks.current.forEach(track => {
        track.stop();
        track.close();
      });
      client.current?.leave();
    };
  }, [vitalsId]);

  return (
    <div className="relative h-screen w-screen bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
      {loading && (
        <div className="z-50 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-white font-medium">Initializing secure connection...</p>
        </div>
      )}

      <div ref={remoteRef} className="absolute inset-0 w-full h-full bg-slate-900" />
      <div ref={localRef} className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-black rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10" />

      {joined && (
        <div className="absolute bottom-10 flex items-center gap-6 z-20">
          <Button onClick={() => {
            localTracks.current[0].setEnabled(!micOn);
            setMicOn(!micOn);
          }} variant={micOn ? "secondary" : "destructive"} className="rounded-full h-14 w-14">
            {micOn ? <Mic /> : <MicOff />}
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} className="bg-red-600 hover:bg-red-700 rounded-full h-16 w-16">
            <PhoneOff className="text-white" />
          </Button>
          <Button onClick={() => {
            localTracks.current[1].setEnabled(!videoOn);
            setVideoOn(!videoOn);
          }} variant={videoOn ? "secondary" : "destructive"} className="rounded-full h-14 w-14">
            {videoOn ? <Video /> : <VideoOff />}
          </Button>
        </div>
      )}
    </div>
  );
}