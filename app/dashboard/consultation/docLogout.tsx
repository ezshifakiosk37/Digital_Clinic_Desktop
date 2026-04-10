// consultation/docLogout.tsx
"use client";
import React from 'react';
import { LOGOUT_REASONS } from './doctor_registration';

interface DocLogoutProps {
  showLogoutModal: boolean;
  setShowLogoutModal: (v: boolean) => void;
  selectedLogoutReason: string;
  setSelectedLogoutReason: (v: string) => void;
  confirmLogout: () => void;
  cancelLogout: () => void;
  logoutLoading?: boolean;        // ← New prop for loader
}

const DocLogout: React.FC<DocLogoutProps> = ({
  showLogoutModal,
  setShowLogoutModal,
  selectedLogoutReason,
  setSelectedLogoutReason,
  confirmLogout,
  cancelLogout,
  logoutLoading = false,          // default false
}) => {
  if (!showLogoutModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">
            Please select reason of logging out
          </h2>
          <button
            onClick={cancelLogout}
            disabled={logoutLoading}
            className="text-red-500 hover:text-red-600 transition-colors text-xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Reasons List */}
        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {LOGOUT_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex items-center gap-3 cursor-pointer group py-2 hover:bg-slate-50 rounded-xl px-2 transition-colors"
            >
              <input
                type="radio"
                name="logoutReason"
                checked={selectedLogoutReason === reason}
                onChange={() => setSelectedLogoutReason(reason)}
                disabled={logoutLoading}
                className="w-5 h-5 accent-[#0297d6] cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-slate-700 font-medium group-hover:text-[#0297d6]">
                {reason}
              </span>
            </label>
          ))}
        </div>

        {/* Confirm Button with Loader */}
        <div className="px-6 py-5 border-t bg-slate-50">
          <button
            onClick={confirmLogout}
            disabled={!selectedLogoutReason || logoutLoading}
            className="w-full bg-[#0297d6] hover:bg-[#0288c2] disabled:bg-slate-300 disabled:cursor-not-allowed 
                       text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
          >
            {logoutLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging out...
              </>
            ) : (
              "Confirm Logout"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocLogout;