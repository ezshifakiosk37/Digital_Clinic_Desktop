import React from 'react';

interface WeightCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  knownWeightValue: string; 
  setKnownWeightValue: (val: string) => void;
}

const WeightCalibrationModal: React.FC<WeightCalibrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  knownWeightValue,
  setKnownWeightValue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Set Calibration Weight</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Please place a <strong>known weight</strong> on the scale and enter its value below to finalize calibration.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Actual Weight of Object (kg)
            </label>
            <input
              type="number"
              autoFocus
              className="w-full rounded-xl border-gray-200 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-16 text-2xl font-semibold px-4 border transition-all"
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
              Set Weight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCalibrationModal;