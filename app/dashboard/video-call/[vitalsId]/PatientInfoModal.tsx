'use client';
import React, { useState } from 'react';
import { X, User, Activity } from 'lucide-react';

interface Vitals {
  temp?: string;
  bp?: string;
  pulse?: string;
  weight?: string;
  height?: string;
  spo2?: string;
}

interface PatientInfo {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  city?: string;
  medicalHistory?: string;
  symptoms?: string;
  token?: string;
  vitals?: Vitals;
}

interface PatientInfoModalProps {
  onClose: () => void;
  patient: PatientInfo | null;
  loading?: boolean;
}

export const PatientInfoModal = ({ onClose, patient, loading }: PatientInfoModalProps) => {
  const [activeTab, setActiveTab] = useState<'demographics' | 'vitals'>('demographics');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">

        {/* Header */}
        <div className="bg-[#0297d6] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Patient Information</h2>
            {patient?.token && (
              <p className="text-blue-100 text-xs mt-0.5">Token #{patient.token}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {([
            { key: 'demographics', label: 'Demographics', icon: User },
            { key: 'vitals',       label: 'Vitals',       icon: Activity },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors border-b-2 ${
                activeTab === key
                  ? 'border-[#0297d6] text-[#0297d6]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-[#0297d6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !patient ? (
            <p className="text-center text-slate-400 text-sm py-8">No patient data available.</p>
          ) : activeTab === 'demographics' ? (
            <div className="space-y-3">
              {[
                { label: 'Full Name',        value: `${patient.firstName ?? '—'} ${patient.lastName ?? ''}`.trim() },
                { label: 'Age',              value: patient.age ? `${patient.age} years` : '—' },
                { label: 'Gender',           value: patient.gender ?? '—' },
                { label: 'Phone',            value: patient.phone ?? '—' },
                { label: 'Email',            value: patient.email ?? '—' },
                { label: 'City',             value: patient.city ?? '—' },
                { label: 'Symptoms',         value: patient.symptoms ?? '—' },
                { label: 'Medical History',  value: patient.medicalHistory ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-32 shrink-0">
                    {label}
                  </span>
                  <span className="text-sm text-slate-700 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Temperature',  value: patient.vitals?.temp,   unit: '°F' },
                { label: 'Blood Pressure', value: patient.vitals?.bp,   unit: 'mmHg' },
                { label: 'Pulse',        value: patient.vitals?.pulse,   unit: 'bpm' },
                { label: 'Weight',       value: patient.vitals?.weight,  unit: 'kg' },
                { label: 'Height',       value: patient.vitals?.height,  unit: 'cm' },
                { label: 'SpO2',         value: patient.vitals?.spo2,    unit: '%' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {label}
                  </span>
                  <span className={`text-sm font-bold ${value ? 'text-slate-800' : 'text-slate-300'}`}>
                    {value ? `${value} ${unit}` : '—'}
                  </span>
                </div>
              ))}
              <p className="text-xs text-slate-400 text-center pt-2">
                Last recorded vitals before consultation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};