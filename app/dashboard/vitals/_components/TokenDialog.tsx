import React from 'react';
import { Loader2, X } from 'lucide-react';

interface TokenDialogProps {
  isOpen: boolean;
  tokenNumber: string;
  setTokenNumber: (value: string) => void;
  onVerify: () => void;
  onClose: () => void;
  isVerifying: boolean;
  // new props
  searchMode: 'token' | 'phone';
  setSearchMode: (mode: 'token' | 'phone') => void;
  phoneSearch: string;
  setPhoneSearch: (value: string) => void;
  onVerifyByPhone: () => void;
}

const TokenDialog = ({
  isOpen,
  tokenNumber,
  setTokenNumber,
  onVerify,
  onClose,
  isVerifying,
  searchMode,
  setSearchMode,
  phoneSearch,
  setPhoneSearch,
  onVerifyByPhone,
}: TokenDialogProps) => {
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (searchMode === 'phone') onVerifyByPhone();
    else onVerify();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10"
        onClick={onClose}
      />

      {/* Card */}
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 relative pointer-events-auto">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-slate-800">Start Patient Session</h2>
            <p className="text-sm text-slate-500 mt-1">
              Search by token number or phone number.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setSearchMode('token')}
              className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                searchMode === 'token'
                  ? 'bg-white text-[#0297d6] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Token
            </button>
            <button
              onClick={() => setSearchMode('phone')}
              className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                searchMode === 'phone'
                  ? 'bg-white text-[#0297d6] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Input */}
          {searchMode === 'token' ? (
            <input
              type="number"
              placeholder="Enter Token Number"
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center text-xl font-semibold focus:ring-2 focus:ring-[#0297d6] outline-none"
              autoFocus
            />
          ) : (
            <input
              type="tel"
              placeholder="e.g. 3001234567"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center text-xl font-semibold focus:ring-2 focus:ring-[#0297d6] outline-none"
              autoFocus
            />
          )}

          {/* Helper text */}
          <p className="text-xs text-slate-400 text-center -mt-2">
            {searchMode === 'token'
              ? 'Enter the token number from registration.'
              : "Enter the patient's registered phone number."}
          </p>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isVerifying || (searchMode === 'token' ? !tokenNumber : !phoneSearch)}
            className="bg-[#0297d6] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#0286c2] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isVerifying ? (
              <><Loader2 className="animate-spin h-4 w-4" /> Verifying...</>
            ) : searchMode === 'token' ? 'Verify Token' : 'Find Patient'}
          </button>

        </div>
      </div>
    </>
  );
};

export default TokenDialog;