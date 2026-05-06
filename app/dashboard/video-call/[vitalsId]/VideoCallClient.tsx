'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  ILocalVideoTrack,
  ILocalAudioTrack,
  IAgoraRTCClient
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Loader2,
  CameraOff, AlertCircle, ClipboardList, X, Pill,
  Search, Trash2, Check, ChevronsUpDown
} from "lucide-react";
import { apiService } from '@/app/_utils/apiService';
import {
  MEDICINE_OPTIONS, DOSAGE_UNIT_OPTIONS, DURATION_UNIT_OPTIONS,
  DIAGNOSIS_OPTIONS, LAB_TEST_OPTIONS
} from '../../consultation/doctor_registration';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Medicine {
  id: number;
  name: string;
  dosage?: string;
  duration?: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  meal: string;
  [key: string]: any;
}

interface VideoCallClientProps {
  vitalsId: string;
  patientId?: string;      // needed to save prescription
  patientToken?: string;   // needed to save prescription
}

// ─── Prescription Modal ───────────────────────────────────────────────────────
function PrescriptionModal({
  onClose,
  patientId,
  patientToken,
}: {
  onClose: () => void;
  patientId?: string;
  patientToken?: string;
}) {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }
  ]);
  const [notes, setNotes] = useState('');
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [labTests, setLabTests] = useState<string[]>([]);
  const [diagnosisOther, setDiagnosisOther] = useState('');
  const [labTestOther, setLabTestOther] = useState('');
  const [manualIds, setManualIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Helpers ──
  const splitDosage = (val: string) => {
    const match = val?.match(/^(\d*\.?\d*)\s*(.*)$/);
    return { num: match?.[1] ?? '', unit: match?.[2] || 'Tab' };
  };
  const splitDuration = (val: string) => {
    const match = val?.match(/^(\d*)\s*(.*)$/);
    return { num: match?.[1] ?? '', unit: match?.[2] || 'Day(s)' };
  };

  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const toggleManual = (id: number) => {
    setManualIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleOtherInput = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!value.trim()) return;
    setter(prev => [...prev.filter(i => !i.startsWith('Other:')), `Other:${value.trim()}`]);
  };

  // ── Save / Send ──
  const handleSave = async () => {
    if (!patientId) {
      alert("No patient ID available to save prescription.");
      return;
    }
    setSaving(true);
    try {
      await apiService.savePrescription({
        patientId,
        token: patientToken,
        diagnosis: diagnoses.length > 0 ? diagnoses.join(', ') : undefined,
        labTest: labTests.length > 0 ? labTests.join(', ') : null,
        clinicalNotes: notes,
        medicines: medicines.filter(m => m.name && m.name.trim() !== '')
      });
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch (err: any) {
      alert(`Failed to save prescription: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    // ── Overlay ──
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-[2rem]">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Pill size={18} className="text-[#0297d6]" />
            Prescription Builder
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-6 space-y-5">

          {/* ── Medicine Rows ── */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Medicines</p>
            <div className="space-y-3">
              {medicines.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl relative group hover:border-[#0297d6]/20 transition-all"
                >
                  <button
                    onClick={() => setMedicines(medicines.filter(m => m.id !== med.id))}
                    className="absolute -right-2 -top-2 bg-white border border-slate-200 text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 shadow transition-all"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Medicine Name */}
                  <div className="mb-3">
                    {manualIds.includes(med.id) ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          placeholder="Type medicine name..."
                          className="w-full p-3 bg-white border-2 border-[#0297d6] rounded-xl outline-none font-bold text-sm"
                          value={med.name}
                          onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                        />
                        <button
                          onMouseDown={() => toggleManual(med.id)}
                          className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black"
                        >✕</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl focus-within:border-[#0297d6]">
                          <Search size={14} className="text-slate-400 shrink-0" />
                          <input
                            placeholder="Search medicine..."
                            className="w-full outline-none font-bold text-sm bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => { setSearchQuery(''); setOpenDropdownId(med.id); }}
                            onBlur={() => setTimeout(() => setOpenDropdownId(null), 150)}
                          />
                        </div>
                        {(openDropdownId === med.id || searchQuery) && (
                          <div className="absolute z-50 left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                            <div
                              onMouseDown={() => { toggleManual(med.id); updateMedicine(med.id, 'name', ''); setSearchQuery(''); }}
                              className="px-4 py-2.5 text-sm font-black text-[#0297d6] hover:bg-[#0297d6]/10 cursor-pointer border-b border-slate-100"
                            >
                              ✏️ Other (type manually)
                            </div>
                            {MEDICINE_OPTIONS.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase())).length > 0
                              ? MEDICINE_OPTIONS.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase())).map((option) => (
                                <div
                                  key={option}
                                  onMouseDown={() => { updateMedicine(med.id, 'name', option); setSearchQuery(''); }}
                                  className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-[#0297d6]/10 hover:text-[#0297d6] cursor-pointer"
                                >
                                  {option}
                                </div>
                              ))
                              : <div className="px-4 py-3 text-xs text-slate-400 font-bold uppercase">No match — use "Other" above</div>
                            }
                          </div>
                        )}
                        {med.name && !searchQuery && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">{med.name}</span>
                            <button
                              onMouseDown={() => { updateMedicine(med.id, 'name', ''); setSearchQuery(''); }}
                              className="text-[10px] text-slate-400 hover:text-red-400 font-black"
                            >✕ clear</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Dosage + Duration */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex gap-1">
                      <input
                        placeholder="Qty" type="number" min="0"
                        className="w-16 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0297d6] font-bold text-sm"
                        value={splitDosage(med.dosage ?? '').num}
                        onChange={(e) => updateMedicine(med.id, 'dosage', `${e.target.value} ${splitDosage(med.dosage ?? '').unit}`.trim())}
                      />
                      <select
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-xs"
                        value={splitDosage(med.dosage ?? '').unit}
                        onChange={(e) => updateMedicine(med.id, 'dosage', `${splitDosage(med.dosage ?? '').num} ${e.target.value}`.trim())}
                      >
                        {DOSAGE_UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1">
                      <input
                        placeholder="Dur" type="number" min="0"
                        className="w-16 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0297d6] font-bold text-sm"
                        value={splitDuration(med.duration ?? '').num}
                        onChange={(e) => updateMedicine(med.id, 'duration', `${e.target.value} ${splitDuration(med.duration ?? '').unit}`.trim())}
                      />
                      <select
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-xs"
                        value={splitDuration(med.duration ?? '').unit}
                        onChange={(e) => updateMedicine(med.id, 'duration', `${splitDuration(med.duration ?? '').num} ${e.target.value}`.trim())}
                      >
                        {DURATION_UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Schedule + Meal */}
                  <div className="flex gap-3 items-center flex-wrap">
                    <select
                      className="p-2 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-xs"
                      value={med.meal}
                      onChange={(e) => updateMedicine(med.id, 'meal', e.target.value)}
                    >
                      <option>After Meal</option>
                      <option>Before Meal</option>
                    </select>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</span>
                    {['morning', 'afternoon', 'night'].map((time) => (
                      <label key={time} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#0297d6]"
                          checked={!!med[time]}
                          onChange={(e) => updateMedicine(med.id, time, e.target.checked)}
                        />
                        <span className="text-xs font-black text-slate-500 uppercase">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setMedicines([...medicines, { id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }])}
              className="mt-3 bg-[#0297d6]/10 text-[#0297d6] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#0297d6]/20 transition-all"
            >
              + Add Medicine
            </button>
          </div>

          {/* ── Diagnosis ── */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diagnosis</p>
            {diagnoses.filter(d => d !== 'Other').length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {diagnoses.filter(d => d !== 'Other').map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                    {d.startsWith('Other:') ? `Other: ${d.slice(6)}` : d}
                    <button
                      onClick={() => {
                        const val = diagnoses.filter(d => d !== 'Other')[i];
                        setDiagnoses(diagnoses.filter((_, j) => diagnoses.filter(d => d !== 'Other')[i] !== diagnoses[j]));
                        if (val?.startsWith('Other:')) setDiagnosisOther('');
                      }}
                      className="hover:text-red-400"
                    >✕</button>
                  </span>
                ))}
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-0 text-left bg-slate-50/50">
                  <div className="flex flex-wrap gap-1 py-1">
                    {diagnoses.length > 0
                      ? diagnoses.map((d) => (
                        <span key={d} className="bg-[#0297d6]/10 text-[#0297d6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20">{d}</span>
                      ))
                      : <span className="text-slate-400 text-sm">Search diagnosis...</span>}
                  </div>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search diagnosis..." />
                  <CommandList>
                    <CommandGroup className="max-h-52 overflow-y-auto">
                      {DIAGNOSIS_OPTIONS.map((option) => (
                        <CommandItem
                          key={option}
                          onSelect={() => setDiagnoses(prev => prev.includes(option) ? prev.filter(d => d !== option) : [...prev, option])}
                          className="flex items-center gap-2"
                        >
                          <div className={`flex h-4 w-4 items-center justify-center rounded border border-primary ${diagnoses.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"}`}>
                            {diagnoses.includes(option) && <Check className="h-3 w-3" />}
                          </div>
                          <span>{option}</span>
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={() => {
                          const hasOther = diagnoses.includes('Other') || diagnoses.some(d => d.startsWith('Other:'));
                          if (hasOther) { setDiagnoses(prev => prev.filter(d => d !== 'Other' && !d.startsWith('Other:'))); setDiagnosisOther(''); }
                          else { setDiagnoses(prev => [...prev, 'Other']); setDiagnosisOther(''); }
                        }}
                        className="flex items-center gap-2 border-t border-slate-100 mt-1 pt-1"
                      >
                        <div className={`flex h-4 w-4 items-center justify-center rounded border border-primary ${diagnoses.includes('Other') || diagnoses.some(d => d.startsWith('Other:')) ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
                          {(diagnoses.includes('Other') || diagnoses.some(d => d.startsWith('Other:'))) && <Check className="h-3 w-3" />}
                        </div>
                        <span className="font-black text-[#0297d6]">✏️ Other (type manually)</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {(diagnoses.includes('Other') || diagnoses.some(d => d.startsWith('Other:'))) && (
              <div className="flex gap-2 mt-2">
                <input
                  autoFocus
                  placeholder="Specify other diagnosis..."
                  className="flex-1 p-3 bg-white border-2 border-[#0297d6] rounded-xl outline-none font-bold text-sm"
                  value={diagnosisOther}
                  onChange={(e) => { setDiagnosisOther(e.target.value); handleOtherInput(e.target.value, setDiagnoses); }}
                />
                <button
                  onClick={() => { setDiagnoses(prev => prev.filter(d => d !== 'Other' && !d.startsWith('Other:'))); setDiagnosisOther(''); }}
                  className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black"
                >✕</button>
              </div>
            )}
          </div>

          {/* ── Lab Tests ── */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lab Tests</p>
            {labTests.filter(t => t !== 'Other').length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {labTests.filter(t => t !== 'Other').map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                    {t.startsWith('Other:') ? `Other: ${t.slice(6)}` : t}
                    <button
                      onClick={() => {
                        const val = labTests.filter(t => t !== 'Other')[i];
                        setLabTests(labTests.filter((_, j) => labTests.filter(t => t !== 'Other')[i] !== labTests[j]));
                        if (val?.startsWith('Other:')) setLabTestOther('');
                      }}
                      className="hover:text-red-400"
                    >✕</button>
                  </span>
                ))}
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-0 text-left bg-slate-50/50">
                  <div className="flex flex-wrap gap-1 py-1">
                    {labTests.length > 0
                      ? labTests.map((t) => (
                        <span key={t} className="bg-[#0297d6]/10 text-[#0297d6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20">{t}</span>
                      ))
                      : <span className="text-slate-400 text-sm">Search lab tests...</span>}
                  </div>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search lab test..." />
                  <CommandList>
                    <CommandGroup className="max-h-52 overflow-y-auto">
                      {LAB_TEST_OPTIONS.map((option) => (
                        <CommandItem
                          key={option}
                          onSelect={() => setLabTests(prev => prev.includes(option) ? prev.filter(t => t !== option) : [...prev, option])}
                          className="flex items-center gap-2"
                        >
                          <div className={`flex h-4 w-4 items-center justify-center rounded border border-primary ${labTests.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"}`}>
                            {labTests.includes(option) && <Check className="h-3 w-3" />}
                          </div>
                          <span>{option}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {(labTests.includes('Other') || labTests.some(t => t.startsWith('Other:'))) && (
              <div className="flex gap-2 mt-2">
                <input
                  autoFocus
                  placeholder="Specify other lab test..."
                  className="flex-1 p-3 bg-white border-2 border-[#0297d6] rounded-xl outline-none font-bold text-sm"
                  value={labTestOther}
                  onChange={(e) => { setLabTestOther(e.target.value); handleOtherInput(e.target.value, setLabTests); }}
                />
                <button
                  onClick={() => { setLabTests(prev => prev.filter(t => t !== 'Other' && !t.startsWith('Other:'))); setLabTestOther(''); }}
                  className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black"
                >✕</button>
              </div>
            )}
          </div>

          {/* ── Clinical Notes ── */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Notes</p>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical remarks, lifestyle advice..."
              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#0297d6] focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
            />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex-1 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all
                ${saved
                  ? 'bg-green-500 text-white'
                  : saving
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-[#0297d6] text-white hover:bg-[#0288c2] active:scale-95'
                }`}
            >
              {saved ? (
                <><Check size={15} /> Saved!</>
              ) : saving ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Pill size={15} /> Save Prescription</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main VideoCallClient ─────────────────────────────────────────────────────
export default function VideoCallClient({ vitalsId, patientId, patientToken }: VideoCallClientProps) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);  // ← NEW

  const client = useRef<IAgoraRTCClient | null>(null);
  const initialized = useRef(false);
  const localAudioTrack = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrack = useRef<ILocalVideoTrack | null>(null);
  const remoteRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initCall = async () => {
      try {
        const authToken = localStorage.getItem('doc_token') || localStorage.getItem('token');
        if (!authToken) throw new Error("No auth token found. Please log in again.");

        const data = await apiService.getAgoraToken(vitalsId);
        if (!data.success) throw new Error(data.error || "Token fetch failed");

        client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        await client.current.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          vitalsId,
          data.token,
          data.uid
        );

        client.current.on("user-published", async (user, mediaType) => {
          try {
            await client.current!.subscribe(user, mediaType);
            if (mediaType === "video" && remoteRef.current) {
              user.videoTrack?.play(remoteRef.current);
            }
            if (mediaType === "audio") {
              user.audioTrack?.play();
            }
          } catch (subErr) {
            console.error("Subscription failed:", subErr);
          }
        });

        client.current.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video" && remoteRef.current) {
            remoteRef.current.innerHTML = '';
          }
        });

        try {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localAudioTrack.current = audioTrack;
          localVideoTrack.current = videoTrack;

          if (localRef.current) {
            videoTrack.play(localRef.current);
          }

          await client.current.publish([audioTrack, videoTrack]);
          setHasCamera(true);

        } catch (deviceErr: any) {
          console.warn("Camera/mic failed:", deviceErr.code);

          if (
            deviceErr.code === 'PERMISSION_DENIED' ||
            deviceErr.message?.includes('Permission denied') ||
            deviceErr.message?.includes('NotAllowedError')
          ) {
            setPermissionDenied(true);
            setHasCamera(false);
            setJoined(true);
            setLoading(false);
            return;
          }

          if (
            deviceErr.code === 'DEVICE_NOT_FOUND' ||
            deviceErr.message?.includes('NotFoundError')
          ) {
            try {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              localAudioTrack.current = audioTrack;
              await client.current!.publish([audioTrack]);
              setHasCamera(false);
            } catch {
              console.warn("No audio device — joined as listener");
              setHasCamera(false);
            }
          }
        }

        setJoined(true);
      } catch (err: any) {
        console.error("Video Call Error:", err);
        setError(err.message || "Failed to join call");
      } finally {
        setLoading(false);
      }
    };

    initCall();

    return () => {
      localAudioTrack.current?.stop();
      localAudioTrack.current?.close();
      localAudioTrack.current = null;
      localVideoTrack.current?.stop();
      localVideoTrack.current?.close();
      localVideoTrack.current = null;
      client.current?.leave();
      client.current = null;
    };
  }, [vitalsId]);

  const handleEndCall = () => {
    localAudioTrack.current?.stop();
    localAudioTrack.current?.close();
    localVideoTrack.current?.stop();
    localVideoTrack.current?.close();
    client.current?.leave();
    const isDoctor = !!localStorage.getItem('doc_token');
    window.location.href = isDoctor ? '/dashboard/consultation' : '/dashboard/vitals';
  };

  if (error) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 font-medium text-center">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} variant="secondary">Retry</Button>
          <Button onClick={handleEndCall} variant="destructive">Leave</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center">

      {/* ── Prescription Modal ── */}
      {isPrescriptionOpen && (
        <PrescriptionModal
          onClose={() => setIsPrescriptionOpen(false)}
          patientId={patientId}
          patientToken={patientToken}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="z-50 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-white font-medium">Initializing secure connection...</p>
        </div>
      )}

      {/* Permission denied banner */}
      {permissionDenied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-500/90 text-black px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          Camera & microphone blocked. Click the lock icon in your browser address bar to allow access, then reload.
        </div>
      )}

      {/* Remote video — full screen */}
      <div ref={remoteRef} className="absolute inset-0 w-full h-full bg-slate-900" />

      {/* Local video — PiP */}
      {hasCamera ? (
        <div
          ref={localRef}
          className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-black rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10"
        />
      ) : (
        <div className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-slate-800 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10 flex items-center justify-center">
          <CameraOff className="h-8 w-8 text-slate-400" />
        </div>
      )}

      {/* Controls */}
      {joined && (
        <div className="absolute bottom-10 flex items-center gap-4 z-20">

          {/* Mic */}
          <Button
            onClick={async () => {
              if (localAudioTrack.current) {
                await localAudioTrack.current.setEnabled(!micOn);
                setMicOn(!micOn);
              }
            }}
            variant={micOn ? "secondary" : "destructive"}
            className="rounded-full h-14 w-14"
            disabled={!localAudioTrack.current}
          >
            {micOn ? <Mic /> : <MicOff />}
          </Button>

          {/* End Call */}
          <Button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 rounded-full h-16 w-16"
          >
            <PhoneOff className="text-white" />
          </Button>

          {/* Camera */}
          <Button
            onClick={async () => {
              if (localVideoTrack.current) {
                await localVideoTrack.current.setEnabled(!videoOn);
                setVideoOn(!videoOn);
              }
            }}
            variant={videoOn ? "secondary" : "destructive"}
            className="rounded-full h-14 w-14"
            disabled={!localVideoTrack.current}
          >
            {videoOn ? <Video /> : <VideoOff />}
          </Button>

          {/* ── Prescription Button (NEW) ── */}
          <Button
            onClick={() => setIsPrescriptionOpen(true)}
            className="rounded-full h-14 w-14 bg-[#0297d6] hover:bg-[#0288c2] text-white shadow-lg shadow-[#0297d6]/40 border-2 border-white/20 transition-all active:scale-95"
            title="Write Prescription"
          >
            <ClipboardList size={20} />
          </Button>

        </div>
      )}
    </div>
  );
}