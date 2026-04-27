import React from 'react';

interface WeightCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRawWeight: string; // The live reading from ESP32
  knownWeightValue: string; // The state value being typed
  setKnownWeightValue: (val: string) => void; // State setter
}

const WeightCalibrationModal: React.FC<WeightCalibrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentRawWeight,
  knownWeightValue,
  setKnownWeightValue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Scale Calibration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Step 1: Ensure scale is tared (at 0).<br/>
          Step 2: Place a physical weight on the scale.<br/>
          Step 3: Enter that weight value below.
        </p>

        {/* Live Hardware Feedback */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Live Sensor Data</span>
          <div className="text-4xl font-mono font-black text-slate-800">
            {currentRawWeight} <span className="text-lg font-normal text-slate-400">kg</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Standard Weight Value
            </label>
            <input
              type="number"
              className="w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-14 text-xl px-4 border transition-all"
              placeholder="e.g. 5.0"
              value={knownWeightValue}
              onChange={(e) => setKnownWeightValue(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Calibrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCalibrationModal;