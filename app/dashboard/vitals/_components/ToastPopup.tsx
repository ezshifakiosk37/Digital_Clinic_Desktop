// components/GlucoseSuccessPopup.tsx
'use client'
import React from 'react'
import { Activity, Check, CheckCircle, X } from 'lucide-react'

interface GlucoseSuccessPopupProps {
  visible: boolean
  glucoseValue: number | null
  onDismiss: () => void
}

export default function GlucoseSuccessPopup({
  visible,
  glucoseValue,
  onDismiss,
}: GlucoseSuccessPopupProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header with close icon */}
        <div className="flex justify-end pt-4 pr-4">
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="text-center pb-8 px-6">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <Check className="w-16 h-16 text-green-600" />
            </div>
          </div>
          {/* <h2 className="text-xl font-bold text-slate-800 mb-2">
            Glucose Value Added
          </h2> */}
          <p className="text-slate-600 mb-6">
            The blood sugar reading has been successfully recorded.
          </p>
          <p className="text-4xl font-extrabold text-[#0297d6] my-4">
            {glucoseValue !== null ? `${glucoseValue} mg/dL` : '136'}
          </p>
          <button
            onClick={onDismiss}
            className="bg-[#0297d6] hover:bg-[#0280bb] text-white font-bold py-3 px-8 rounded-xl transition-colors text-lg shadow-md"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}