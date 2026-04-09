// consultation/components/MultiSelect.tsx
"use client";
import React, { useState } from 'react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  allowCustom?: boolean;
  position?: 'top' | 'bottom';
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options, selected, onChange, placeholder, disabled = false, allowCustom = false, position = 'bottom'
}) => {
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const toggle = (s: string) =>
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className="w-full min-h-10.5 px-3 py-1.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-left flex flex-wrap items-center gap-1 pr-7 disabled:opacity-60 disabled:cursor-default"
      >
        {selected.length > 0 ? selected.map(s => (
          <span key={s} className="bg-[#0297d6]/10 text-[#0297d6] text-[14px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20 whitespace-nowrap">
            {s}
          </span>
        )) : <span className="text-slate-400 text-sm">{placeholder}</span>}
        {!disabled && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm lg:text-es">▾</span>}
      </button>

      {open && !disabled && (
        <div className={`absolute z-50 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-3 max-h-48 overflow-y-auto ${position === 'top' ? 'bottom-full mb-2' : 'mt-1 top-full'}`}>
          {options.map(s => (
            <label key={s} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0297d6] text-md lg:text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={selected.includes(s)}
                onChange={() => toggle(s)}
                className="accent-[#0297d6]"
              />
              {s}
            </label>
          ))}
          {allowCustom && selected.includes('Other') && (
            <input
              type="text"
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              placeholder="Enter custom value..."
              className="mt-2 w-full px-3 py-2 bg-slate-50 rounded-xl text-md lg:text-sm border border-slate-200 outline-none focus:border-[#0297d6]"
            />
          )}
        </div>
      )}
    </div>
  );
};