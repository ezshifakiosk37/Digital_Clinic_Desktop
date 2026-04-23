"use client";
import { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { updateCallStatus } from "@/app/_utils/apiService";
import { CallState } from "@/app/_utils/types";

interface Props {
  callState: CallState;
  onClose: () => void;
  isDoctor?: boolean;
}

export default function VideoCallModal({ callState, onClose, isDoctor = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "ended">("connecting");

  useEffect(() => {
    if (!callState.roomUrl || !containerRef.current) return;

    const call = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      showFullscreenButton: true,
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "12px",
      },
    });

    call.join({ url: callState.roomUrl, token: callState.token });

    call.on("joined-meeting", async () => {
      setStatus("connected");
      if (callState.vitalsId) {
        await updateCallStatus(callState.vitalsId, "active");
      }
    });

    call.on("left-meeting", async () => {
      setStatus("ended");
      if (callState.vitalsId) {
        await updateCallStatus(callState.vitalsId, "ended");
      }
      onClose();
    });

    return () => { call.destroy(); };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90vw] h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-slate-50">
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
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 font-bold text-sm transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
          >
            ✕ End Call
          </button>
        </div>
        <div ref={containerRef} className="flex-1" />
      </div>
    </div>
  );
}