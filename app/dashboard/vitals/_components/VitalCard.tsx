import React from 'react';
import { VitalType } from '../../../_utils/types';
import { VITAL_CONFIGS } from '../../../_utils/data/constants';
import { Button } from '@/components/ui/button';

interface VitalCardProps {
  type: VitalType;
  value?: string;
  value1?: string;
  value2?: string;
  onChange?: (value: string) => void;
  onChange1?: (value1: string) => void;
  onChange2?: (value2: string) => void;
  onCalibrate?: () => void;
  isEditable?: boolean;
  timestamp?: string | number | Date;
  isDualValue?: boolean;
  customContent?: React.ReactNode;
  toggleHeightUnit?: () => void;
  heightUnit?: string;
  statusLabel?: string;       // 👈 added
  statusColor?: string;       // 👈 added
}

const VitalCard: React.FC<VitalCardProps> = ({
  type,
  value,
  value1,
  value2,
  onChange,
  onChange1,
  onChange2,
  onCalibrate,
  customContent,
  isEditable = true,
  timestamp,
  toggleHeightUnit,
  heightUnit,
  isDualValue = false,
  statusLabel,                // 👈 added
  statusColor,                // 👈 added
}) => {
  const config = VITAL_CONFIGS[type];

  return (
    <div className="bg-white p-3 md:p-5 rounded-2xl shadow-lg shadow-black/10 border border-slate-100 flex flex-col items-start hover:border-primary/20 transition-all group w-full">
      <div className="flex justify-between items-center w-full mb-2">
        <h3 className="text-primary tracking-wider text-sm font-semibold mb-1 uppercase">{type}</h3>
        <div className={`flex gap-2`}>
          {type === VitalType.HEIGHT && (
            <button
              onClick={toggleHeightUnit}
              className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 text-xs font-bold shrink-0"
            >
              <span className={`px-2 py-1 rounded-md transition-colors ${heightUnit === 'ft' ? 'bg-[#0297d6] text-white' : 'text-slate-400'}`}>ft</span>
              <span className={`px-2 py-1 rounded-md transition-colors ${heightUnit === 'cm' ? 'bg-[#0297d6] text-white' : 'text-slate-400'}`}>cm</span>
            </button>
          )}
          <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-primary/10 transition-colors">
            {config.icon("w-6 h-6 text-primary")}
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between w-full">
        {customContent ? customContent : isEditable ? (
          isDualValue ? (
            <div className='flex'>
              <input
                type="text"
                value={value1 ?? ''}
                placeholder="--"
                onChange={(e) => onChange1?.(e.target.value)}
                className={`text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none rounded px-1 ${value1 && value1.length > 2 ? "w-16 md:w-18" : "w-12 md:w-14"} transition-all`}
              />
              <h2 className='text-4xl'>/</h2>
              <input
                type="text"
                value={value2 ?? ''}
                placeholder="--"
                onChange={(e) => onChange2?.(e.target.value)}
                className={`text-2xl md:text-4xl text-end font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none rounded px-1 ${value2 && value2.length > 2 ? "w-16 md:w-18" : "w-12 md:w-14"} transition-all`}
              />
            </div>
          ) : (
            <div className='flex items-center space-x-4'>
              <input
                type="text"
                value={value ?? ''}
                placeholder="--"
                onChange={(e) => onChange?.(e.target.value)}
                className="text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none w-[50%] rounded px-1 transition-all"
              />
              {type === VitalType.WEIGHT && (
                <Button className='px-4 py-2 text-sm' onClick={onCalibrate}>
                  Calibrate
                </Button>
              )}
            </div>
          )
        ) : (
          <span className="text-xl font-bold text-secondary">{value || '--'}</span>
        )}
        {!customContent && (
          // 👇 show status label instead of unit when statusLabel is provided
          statusLabel ? (
            <span className={`text-sm font-bold ${statusColor ?? 'text-slate-400'}`}>
              {statusLabel}
            </span>
          ) : (
            <span className="text-slate-500 font-medium">{config.unit}</span>
          )
        )}
      </div>

      {timestamp && (
        <p className="mt-2 text-[10px] text-slate-400 font-medium">
          {new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      )}
    </div>
  );
};

export default VitalCard;