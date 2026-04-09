// consultation/components/SingleSelect.tsx
"use client";
import React, { useState } from 'react';

interface SingleSelectProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  position?: 'top' | 'bottom';
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  options, value, onChange, placeholder, disabled = false, position = 'bottom'
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className="w-full px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-left flex justify-between items-center disabled:opacity-60"
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <span className="text-slate-400 text-xs">▾</span>
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-2 max-h-48 overflow-y-auto ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-1'}`}>
            {options.map(s => (
              <div
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-50 hover:text-[#0297d6] rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                {s}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};