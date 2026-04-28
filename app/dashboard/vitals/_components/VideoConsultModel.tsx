import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, X, Stethoscope } from "lucide-react";

interface VideoConsultModelProps {
  isOpen: boolean;
  onClose: () => void;
  vitalsId: string | null;
}

export const VideoConsultModel = ({ isOpen, onClose, vitalsId }: VideoConsultModelProps) => {
  const handleStartConsult = () => {
    if (!vitalsId) return console.log("vitalsId not found");
    window.location.href = `/dashboard/video-call/${vitalsId}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none rounded-2xl shadow-2xl">
        {/* Header Branding Strip */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-green-500 w-full" />
        
        <div className="p-8 bg-white">
          <DialogHeader className="flex flex-col items-center justify-center space-y-2">
            {/* Animated Icon Container */}
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
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Stethoscope className="h-5 w-5 text-slate-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-700">Dr. Available Online</p>
                <p className="text-slate-500 text-xs">Typical wait time: &lt; 2 mins</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="ghost" 
                className="flex-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-semibold h-12"
                onClick={onClose}
              >
                Skip for now
              </Button>
              <Button 
                className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 h-12 font-bold text-base gap-2"
                onClick={handleStartConsult}
              >
                <Video className="h-5 w-5" />
                Start Consultation
              </Button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Secure End-to-End Encryption
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};