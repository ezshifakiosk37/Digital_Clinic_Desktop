'use client'
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Stethoscope, Loader2, AlertCircle, Clock } from "lucide-react";
import { apiService } from '@/app/_utils/apiService';

interface VideoConsultModelProps {
  isOpen: boolean;
  onClose: () => void;
  vitalsId: string | null;
  patientId: string | null;
  patientToken: string | null;
}

export const VideoConsultModel = ({ isOpen, onClose, vitalsId, patientId, patientToken }: VideoConsultModelProps) => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingForDoctor, setIsWaitingForDoctor] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);  // ✅
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError("User data not found.");
        return;
      }

      try {
        const userObj = JSON.parse(userString);
        const storedKioskId = userObj.id;

        const fetchAssignedDoctor = async () => {
          setLoadingDoctor(true);
          setError(null);
          try {
            // ✅ replaced raw fetch with apiService
            const token = localStorage.getItem('token') || localStorage.getItem('doc_token');
            const data = await apiService.getAssignedDoctor(storedKioskId);
            if (data.success) setDoctorId(data.doctorId);
            else setError(data.error || "No doctor assigned");
          } catch (err) {
            setError("Connection failed");
          } finally {
            setLoadingDoctor(false);
          }
        };

        fetchAssignedDoctor();
      } catch (e) {
        setError("Invalid session data.");
      }
    } else {
      setIsConnecting(false);
      setIsWaitingForDoctor(false);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isOpen]);

  const startPollingStatus = (vid: string) => {
    console.log("🚀 [startPollingStatus] Called with vid:", vid);
    setIsWaitingForDoctor(true);

    if (pollIntervalRef.current) {
      console.log("⚠️ [startPollingStatus] Clearing existing poll interval before starting new one");
      clearInterval(pollIntervalRef.current);
    }

    console.log("⏳ [startPollingStatus] Setting 30s timeout...");
    const timeoutId = setTimeout(() => {
      console.log("🕐 [TIMEOUT] 30 seconds elapsed — doctor did not respond. Calling handleCancel...");
      clearInterval(pollIntervalRef.current!);
      handleCancel("doctor_not_responding");
      alert("Doctor did not respond in time.");
    }, 30000);

    timeoutRef.current = timeoutId;
    console.log("✅ [startPollingStatus] 30s timeout set. Starting poll interval every 2s...");

    pollIntervalRef.current = setInterval(async () => {
      console.log("🔄 [POLL] Tick — calling getCallStatus for vid:", vid);
      try {
        const data = await apiService.getCallStatus(vid);
        console.log("📦 [POLL] Response received:", data);

        if (!data?.status) {
          console.log("⚠️ [POLL] No status in response, skipping tick.");
          return;
        }

        console.log("📋 [POLL] Status:", data.status);

        if (data.status === 'accepted') {
          console.log("✅ [POLL] Doctor accepted! Clearing interval + timeout, redirecting...");
          clearInterval(pollIntervalRef.current!);
          clearTimeout(timeoutId);
          const query = new URLSearchParams();
          if (patientId) query.set('patientId', patientId);
          if (patientToken) query.set('patientToken', patientToken);
          window.location.href = `/dashboard/video-call/${vid}?${query.toString()}`;
          return;
        }

        if (data.status === 'declined_by_doctor') {
          console.log("❌ [POLL] Doctor declined. Clearing interval + timeout, closing modal...");
          clearInterval(pollIntervalRef.current!);
          clearTimeout(timeoutId);
          setIsWaitingForDoctor(false);
          setIsConnecting(false);
          alert("Doctor declined the call.");
          onClose();
          return;
        }

        if (data.status === 'declined_by_patient') {
          console.log("🚪 [POLL] Patient declined. Clearing interval + timeout, closing modal...");
          clearInterval(pollIntervalRef.current!);
          clearTimeout(timeoutId);
          setIsWaitingForDoctor(false);
          setIsConnecting(false);
          onClose();
          return;
        }

        console.log("⏸️ [POLL] Status not actionable yet, waiting for next tick...");

      } catch (err: any) {
        console.error("💥 [POLL] getCallStatus threw an error:", err.message || err);
      }
    }, 2000);

    console.log("✅ [startPollingStatus] Poll interval started.");
  };

  const handleStartConsult = async () => {
    if (!vitalsId || !doctorId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in again.");
      return;
    }

    setIsConnecting(true);
    try {
      await apiService.alertDoctor(doctorId, vitalsId);
      startPollingStatus(vitalsId);
    } catch (err: any) {
      setIsConnecting(false);
      console.error("Alert doctor failed:", err.message || err);

      // ✅ Specific message for stale doctor token (410)
      if (err.status === 410) {
        alert("The doctor is currently unavailable. Please ask them to reopen their app and try again.");
      } else {
        alert(err.message || "Failed to start consultation");
      }
    }
  };

  const handleCancel = async (reason: string) => {
    console.log("🛑 [handleCancel] Called with reason:", reason);
    try {
      if (vitalsId) {
        console.log("📡 [handleCancel] Calling endCall with vitalsId:", vitalsId);
        await apiService.endCall(vitalsId, reason);
        console.log("✅ [handleCancel] endCall succeeded");
      }
    } catch (err: any) {
      console.error("💥 [handleCancel] endCall failed:", err.message || err);
    }
    if (pollIntervalRef.current) {
      console.log("🧹 [handleCancel] Clearing poll interval");
      clearInterval(pollIntervalRef.current);
    }
    if (timeoutRef.current) {
      console.log("🧹 [handleCancel] Clearing timeout ref");
      clearTimeout(timeoutRef.current);
    }
    setIsWaitingForDoctor(false);
    setIsConnecting(false);
    console.log("🚪 [handleCancel] Calling onClose()");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 overflow-hidden p-0 border-none rounded-2xl shadow-2xl">
        <div className="h-2 bg-linear-to-r from-blue-500 to-green-500 w-full" />

        <div className="p-8 bg-white">
          <DialogHeader className="flex flex-col items-center justify-center space-y-2">
            <div className="relative mb-4">
              {isWaitingForDoctor ? (
                <div className="relative bg-amber-50 p-6 rounded-full border border-amber-100 shadow-sm">
                  <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                  <div className="relative bg-blue-50 p-6 rounded-full border border-blue-100 shadow-sm">
                    <Video className="h-10 w-10 text-blue-600" />
                  </div>
                </>
              )}
            </div>

            <DialogTitle className="text-2xl font-extrabold text-slate-800 tracking-tight text-center">
              {isWaitingForDoctor ? "Waiting for Doctor..." : "Ready for Consultation"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-center text-balance font-medium">
              {isWaitingForDoctor
                ? "The doctor has been notified. Please stay on this screen while they join the call."
                : "Vitals have been successfully synchronized with the clinic database."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className={`rounded-xl p-4 flex items-center gap-4 border ${isWaitingForDoctor ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
              {isWaitingForDoctor ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              ) : error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Stethoscope className="h-5 w-5 text-slate-600" />
              )}
              <div className="text-sm">
                <p className={`font-semibold ${isWaitingForDoctor ? 'text-amber-700' : 'text-slate-700'}`}>
                  {isWaitingForDoctor ? "Paging Assigned Doctor" : error ? "Doctor Unavailable" : "Doctor Available Online"}
                </p>
                <p className="text-slate-500 text-xs">
                  {isWaitingForDoctor ? "Connecting to secure line..." : error || "Typical wait time: < 2 mins"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                className="flex-1 text-slate-500 font-semibold h-12"
                onClick={() => handleCancel('declined_by_patient')}
                disabled={isConnecting && !isWaitingForDoctor && !error}
              >
                {isWaitingForDoctor ? "Cancel Request" : "Skip for now"}
              </Button>
              {!isWaitingForDoctor && (
                <Button
                  className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12 font-bold gap-2"
                  onClick={handleStartConsult}
                  disabled={isConnecting || !doctorId}
                >
                  {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
                  {isConnecting ? "Alerting..." : "Start Consultation"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};