"use client";
import { useState } from "react";
import { createVideoRoom, createVideoToken } from "@/app/_utils/apiService";
import { CallState } from "@/app/_utils/types";

interface Props {
  vitalsId: string;
  vitalsSubmitted: boolean;
  onCallReady: (callState: CallState) => void;
}

export default function OnlineConsultButton({ vitalsId, vitalsSubmitted, onCallReady }: Props) {
  const [loading, setLoading] = useState(false);

  const handleStartConsult = async () => {
    if (!vitalsId) return;
    setLoading(true);
    try {
      const room = await createVideoRoom(vitalsId);
      const tokenData = await createVideoToken(room.roomName, false);
      onCallReady({
        status: "waiting",
        roomUrl: room.roomUrl,
        roomName: room.roomName,
        token: tokenData.token,
        vitalsId,
      });
    } catch (err) {
      console.error("Failed to start consultation:", err);
      alert("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartConsult}
      disabled={!vitalsSubmitted || loading}
      className={`
        px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 text-sm
        ${vitalsSubmitted
          ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 cursor-pointer animate-pulse"
          : "bg-gray-300 cursor-not-allowed opacity-50"
        }
      `}
    >
      {loading ? "Connecting..." : "🎥 Online Consult"}
    </button>
  );
}