"use client";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { updateCallStatus } from "@/app/_utils/apiService";
import { LIVEKIT_URL } from "@/app/_utils/apiService";
import { CallState } from "@/app/_utils/types";

interface Props {
  callState: CallState;
  onClose: () => void;
  isDoctor?: boolean;
}

export default function VideoCallModal({ callState, onClose, isDoctor = false }: Props) {
  const [status, setStatus] = useState<"connecting" | "connected" | "ended">("connecting");

  const handleDisconnect = async () => {
    setStatus("ended");
    if (callState.vitalsId) {
      await updateCallStatus(callState.vitalsId, "ended");
    }
    onClose();
  };

  if (!callState.token || !callState.roomName) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90vw] h-[85vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${
              status === "connected" ? "bg-green-500 animate-pulse" :
              status === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            }`} />
            <span className="font-bold text-slate-800 text-sm">
              {isDoctor ? "Patient Consultation" : "Doctor Consultation"}
            </span>
            <span className="text-xs text-slate-400 capitalize">{status}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-slate-400 hover:text-red-500 font-bold text-sm transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
          >
            ✕ End Call
          </button>
        </div>

        {/* LiveKit Room */}
        <div className="flex-1 overflow-hidden">
          <LiveKitRoom
            token={callState.token}
            serverUrl={LIVEKIT_URL}
            connect={true}
            video={true}
            audio={true}
            onConnected={() => setStatus("connected")}
            onDisconnected={handleDisconnect}
            style={{ height: "100%" }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>

      </div>
    </div>
  );
}