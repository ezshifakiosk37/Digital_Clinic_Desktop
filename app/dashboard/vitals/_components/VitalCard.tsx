import React from 'react';
import { VitalType } from '../../../_utils/types';
import { VITAL_CONFIGS } from '../../../_utils/data/constants';

interface VitalCardProps {
  type: VitalType;
  value?: string // Passed from parent state
  value1?: string // Passed from parent state
  value2?: string // Passed from parent state
  onChange?: (value: string) => void; // Callback to update parent state
  onChange1?: (value1: string) => void; // Callback to update parent state
  onChange2?: (value2: string) => void; // Callback to update parent state
  isEditable?: boolean;
  timestamp?: string | number | Date;
  isDualValue?: boolean
}

const VitalCard: React.FC<VitalCardProps> = ({
  type,
  value,
  value1,
  value2,
  onChange,
  onChange1,
  onChange2,
  isEditable = true,
  timestamp,
  isDualValue = false
}) => {
  const config = VITAL_CONFIGS[type];
  console.log(value2?.toString().length)

  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg shadow-black/10 border border-slate-100 flex flex-col items-start hover:border-primary/20 transition-all group w-full">
      <div className="flex justify-between items-center w-full mb-2">
        <h3 className="text-primary tracking-wider text-sm font-semibold mb-1 uppercase">{type}</h3>
        <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-primary/10 transition-colors">
          {config.icon("w-6 h-6 text-primary")}
        </div>
      </div>

      <div className="flex items-baseline justify-between w-full">
        {isEditable ? (
          isDualValue ? (
            <div className='flex'>
              <input
                type="text"
                value={isDualValue && value1}
                placeholder="--"
                onChange={(e) => onChange1?.(e.target.value)}
                className={`text-4xl font-bold text-secondary  border-b-2 border-transparent focus:border-primary focus:outline-none rounded px-1 ${value1 && value1?.toString().length > 2 ? "w-18" : "w-14"} transition-all`}
              />
              <h2 className='text-4xl'>/</h2>
              <input
                type="text"
                value={isDualValue && value2}
                placeholder="--"
                onChange={(e) => onChange2?.(e.target.value)}
                className={`text-4xl text-end font-bold text-secondary  border-b-2 border-transparent focus:border-primary focus:outline-none rounded px-1 ${value2 && value2?.toString().length > 2 ? "w-18" : "w-14"} transition-all`}
              />
            </div>
          ) : (
            <input
              type="text"
              value={value}
              placeholder="--"
              onChange={(e) => onChange?.(e.target.value)}
              className="text-4xl font-bold text-secondary  border-b-2 border-transparent focus:border-primary focus:outline-none w-[50%] rounded px-1 transition-all"
            />
          )
        ) : (
          <span className="text-xl font-bold text-secondary">
            {value || '--'}
          </span>
        )}
        <span className="text-slate-500 font-medium">{config.unit}</span>
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