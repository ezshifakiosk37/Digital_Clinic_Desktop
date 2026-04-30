'use client'
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Stethoscope, Loader2, AlertCircle, Clock } from "lucide-react";

interface VideoConsultModelProps {
  isOpen: boolean;
  onClose: () => void;
  vitalsId: string | null;
}

export const VideoConsultModel = ({ isOpen, onClose, vitalsId }: VideoConsultModelProps) => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingForDoctor, setIsWaitingForDoctor] = useState(false); // New State

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/assigned-doctor/${storedKioskId}`);
            const data = await res.json();
            if (data.success) setDoctorId(data.doctorId);
            else setError(data.error || "No doctor assigned");
          } catch (err) {
            setError("Connection failed");
          } finally {
            setLoadingDoctor(false);
          }
        };
        fetchAssignedDoctor();
      } catch (e) { setError("Invalid session data."); }
    } else {
      // Reset states when modal closes
      setIsConnecting(false);
      setIsWaitingForDoctor(false);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isOpen]);

  const startPollingStatus = (vid: string) => {
    setIsWaitingForDoctor(true);
    const startTime = Date.now();

    pollIntervalRef.current = setInterval(async () => {
      // 1. TRY TO GET THE STATUS FIRST
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/call-status/${vid}`, {
          headers: {
            // ADD THIS HEADER:
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();

        if (data.status === 'accepted') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          window.location.href = `/dashboard/video-call/${vid}`;
          return; // Exit early since we succeeded
        } else if (data.status === 'declined') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsWaitingForDoctor(false);
          setIsConnecting(false);
          alert("Doctor declined the call.");
          onClose();
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      // 2. CHECK TIMEOUT AFTER THE ATTEMPT
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (elapsedSeconds >= 20) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        // Trigger the cleanup so the doctor's modal closes
        handleCancel();

        alert("Doctor did not respond in time.");
        return;
      }
    }, 2000);
  };

  const handleStartConsult = async () => {
    if (!vitalsId || !doctorId) return;
    setIsConnecting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/alert-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ doctorId, vitalsId })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to alert doctor");

      // ✅ INSTEAD OF REDIRECTING, START POLLING
      startPollingStatus(vitalsId);

    } catch (err: any) {
      setIsConnecting(false);
      alert(err.message);
    }
  };

  // Inside VideoConsultModel
  const handleCancel = async () => {
    if (isWaitingForDoctor && vitalsId) {
      // Tell backend to reset status so doctor doesn't see a "ghost" call
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/end-call`, {
          method: 'POST',
           headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
          body: JSON.stringify({ vitalsId })
        });
      } catch (e) { console.error("Cancel failed", e); }
    }

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none rounded-2xl shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-green-500 w-full" />

        <div className="p-8 bg-white">
          <DialogHeader className="flex flex-col items-center justify-center space-y-2">
            <div className="relative mb-4">
              {/* UI changes based on state */}
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
                onClick={handleCancel} // Use the new handler
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