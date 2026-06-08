import React from 'react';
import { Loader2, X } from 'lucide-react'; // Import X icon

interface TokenDialogProps {
  isOpen: boolean;
  tokenNumber: string;
  setTokenNumber: (value: string) => void;
  onVerify: () => void;
  onClose: () => void; // New prop
  isVerifying: boolean;
}

const TokenDialog = ({
  isOpen,
  tokenNumber,
  setTokenNumber,
  onVerify,
  onClose,
  isVerifying
}: TokenDialogProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay — only covers vitals section */}
      <div className="absolute inset-0 bg-black/05 backdrop-blur-sm z-10" />

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10"
        onClick={onClose} // Optional: close when clicking outside
      />

      {/* Token card */}
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 relative pointer-events-auto">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 cursor-pointer right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>

          <div>
            <h2 className="text-lg font-bold text-slate-800">Enter Token Number</h2>
            <p className="text-sm text-slate-500 mt-1">Verify the patient token from the reception.</p>
          </div>

          <input
            type="number"
            placeholder="Enter Token"
            value={tokenNumber}
            onChange={(e) => setTokenNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onVerify()}
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center text-xl font-semibold focus:ring-2 focus:ring-primary outline-none"
            autoFocus
          />

          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Verifying...</>
            ) : "Verify Token"}
          </button>
        </div>
      </div>
    </>
  );
};

export default TokenDialog;