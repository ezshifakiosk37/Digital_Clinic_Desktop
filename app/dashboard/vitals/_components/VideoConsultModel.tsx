'use client'
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Stethoscope, Loader2, AlertCircle } from "lucide-react";

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

  useEffect(() => {
    if (isOpen) {
      // 1. Get the string from localStorage
      const userString = localStorage.getItem('user');

      if (!userString) {
        setError("User data not found. Please re-login.");
        return;
      }

      try {
        // 2. Parse the JSON string into an object
        const userObj = JSON.parse(userString);
        const storedKioskId = userObj.id; // Extract the 'id' field

        if (!storedKioskId) {
          setError("Kiosk ID missing in user profile.");
          return;
        }

        const fetchAssignedDoctor = async () => {
          setLoadingDoctor(true);
          setError(null);
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/assigned-doctor/${storedKioskId}`);
            const data = await res.json();

            if (data.success) {
              setDoctorId(data.doctorId);
            } else {
              setError(data.error || "No doctor assigned");
            }
          } catch (err) {
            setError("Connection failed");
          } finally {
            setLoadingDoctor(false);
          }
        };

        fetchAssignedDoctor();
      } catch (parseError) {
        console.error("Error parsing user object:", parseError);
        setError("Invalid session data.");
      }
    }
  }, [isOpen]);

  const handleStartConsult = async () => {
    console.log("VitalsID" + vitalsId)
    console.log("doctorId" + doctorId)
    if (!vitalsId || !doctorId) return;

    setIsConnecting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/alert-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // patientName is now removed from the payload
        body: JSON.stringify({ doctorId, vitalsId })
      });

      if (!response.ok) throw new Error("Failed to alert doctor");

      window.location.href = `/dashboard/video-call/${vitalsId}`;
    } catch (err: any) {
      setIsConnecting(false);
      alert(err.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none rounded-2xl shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-green-500 w-full" />

        <div className="p-8 bg-white">
          <DialogHeader className="flex flex-col items-center justify-center space-y-2">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
              <div className="relative bg-blue-50 p-6 rounded-full border border-blue-100 shadow-sm">
                <Video className="h-10 w-10 text-blue-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white h-5 w-5 rounded-full" />
            </div>

            <DialogTitle className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Ready for Consultation
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-center text-balance font-medium">
              Vitals have been successfully synchronized with the clinic database.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4 border border-slate-100">
              {loadingDoctor ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Stethoscope className="h-5 w-5 text-slate-600" />
                </div>
              )}
              <div className="text-sm">
                <p className="font-semibold text-slate-700">
                  {error ? "Doctor Unavailable" : "Doctor Available Online"}
                </p>
                <p className="text-slate-500 text-xs">
                  {error || "Typical wait time: < 2 mins"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                className="flex-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold h-12"
                onClick={onClose}
                disabled={isConnecting}
              >
                Skip for now
              </Button>
              <Button
                className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 h-12 font-bold text-base gap-2"
                onClick={handleStartConsult}
                disabled={isConnecting || !doctorId}
              >
                {isConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Video className="h-5 w-5" />
                )}
                {isConnecting ? "Connecting..." : "Start Consultation"}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Secure End-to-End Encryption
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};