// consultation/doc_consult.tsx
"use client";
// // consultation/doc_consult.tsx
import React, { useState } from 'react';
import { Pill, Printer, Search, Trash2, User, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { DoctorProfile, MEDICINE_OPTIONS, DOSAGE_UNIT_OPTIONS, DURATION_UNIT_OPTIONS, DIAGNOSIS_OPTIONS, LAB_TEST_OPTIONS } from './doctor_registration';
import { apiService } from '@/app/_utils/apiService';
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';
import { DocConsultProps } from '@/app/_utils/types';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const DocConsult: React.FC<DocConsultProps> = ({
    selectedPatient,
    setSelectedPatient,
    medicines,
    setMedicines,
    notes,
    setNotes,
    prescriptionGenerated,
    setPrescriptionGenerated,
    doctor,
    updateMedicine,
    fullName,
    onSessionEnd,
    endingSession,
    setEndingSession,
}) => {
    const [manualIds, setManualIds] = useState<number[]>([]);

    const splitDosage = (val: string) => {
        const match = val?.match(/^(\d*\.?\d*)\s*(.*)$/);
        return { num: match?.[1] ?? '', unit: match?.[2] || 'Tab' };
    };
    const splitDuration = (val: string) => {
        const match = val?.match(/^(\d*)\s*(.*)$/);
        return { num: match?.[1] ?? '', unit: match?.[2] || 'Day(s)' };
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [isOpenPrescriptionSend, setIsOpenPrescriptionSend] = useState(false);
    const [diagnoses, setDiagnoses] = useState<string[]>([]);
    const [labTest, setlabTest] = useState<string[]>([]);
    const [diagnosisOther, setDiagnosisOther] = useState('');
    const [labTestOther, setLabTestOther] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);

    console.log(medicines)

    const handleDispense = () => {
        // Logic is now a one-liner. 
        // If it returns false, you can trigger your UI feedback/toast.
        const success = AndroidBridge.dispenseMedicine(2, 4, 6);

        if (!success) {
            alert("Dispense triggered (Simulated: No Hardware Connected)");
        }
    };


    const handlePrescriptionPrint = async () => {
    setIsPrinting(true);

    // IMPORTANT: Delay execution by 100ms. 
    // This gives the DOM time to render the loading spinner and disable the button.
    setTimeout(async () => {
        const rxElement = document.getElementById('prescription-paper');
        
        if (!rxElement) {
            console.error("Element not found");
            setIsPrinting(false);
            return;
        }

        try {
            // REDUCED pixelRatio: 3 is overkill for most thermal printers.
            // Most thermal printers are 203 DPI. 1.5 or 2 is usually plenty.
            const dataUrl = await toPng(rxElement, {
                backgroundColor: '#ffffff',
                pixelRatio: 2, 
                skipFonts: true, // Speeds up processing significantly
            });

            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            window.AndroidNative?.printImage(base64Data);

        } catch (err: any) {
            console.error("Print Error:", err);
            alert("Execution failed.");
        } finally {
            setIsPrinting(false);
        }
    }, 100); 
};

    const toggleManual = (id: number) => {
        setManualIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleOtherInput = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (!value.trim()) return;
        setter(prev => {
            const filtered = prev.filter(i => !i.startsWith('Other:'));
            return [...filtered, `Other:${value.trim()}`];
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <main className="max-w-7xl mx-auto p-6 lg:p-1">
                {/* ── PATIENT DETAIL ── */}
                <div className="lg:mt-2 lg:mx-4 lg:pb-8">
                    {/* Back Button */}
                    <button
                        onClick={() => setSelectedPatient(null)}
                        className="mb-6 bg-[#0297d6] text-white py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#0288c2] transition-all"
                    >
                        ← Back to Queue
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        {/* LEFT PANEL - Patient Info + Vitals */}
                        <div className="lg:col-span-5 bg-slate-50 p-6 lg:p-8 rounded-[2.5rem]">
                            <div className="flex gap-20 lg:gap-4 mb-8 bg-white p-5 rounded-3xl shadow-sm">
                                <div className="w-25 h-25 bg-slate-100 rounded-2xl flex items-center justify-center text-[#0297d6] shrink-0">
                                    <User size={72} />
                                </div>

                                <div className="flex-1">
                                    <div className="mb-3">
                                        <span className="text-lg lg:text-xs font-black text-slate-400 uppercase tracking-widest">NAME: </span>
                                        <span className="text-2xl lg:text-sm font-black text-slate-900">
                                            {selectedPatient.firstName} {selectedPatient.lastName}
                                        </span>
                                    </div>

                                    <div className="flex gap-6">
                                        <div>
                                            <span className="text-lg lg:text-xs font-black text-slate-400 uppercase tracking-widest">AGE: </span>
                                            <span className="text-2xl lg:text-sm font-semibold text-slate-700">
                                                {selectedPatient.age} Years
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-lg lg:text-xs font-black text-slate-400 uppercase tracking-widest">GENDER: </span>
                                            <span className="text-2xl lg:text-sm font-semibold text-slate-700">
                                                {selectedPatient.gender}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current Symptoms */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CURRENT SYMPTOMS</p>
                                <p className="text-sm font-bold text-red-500">{selectedPatient.symptoms}</p>
                            </div>

                            {/* Vitals */}
                            <div className="grid grid-cols-2 gap-3">
                                {selectedPatient.vitals && Object.entries(selectedPatient.vitals).map(([k, v]) => (
                                    <div key={k} className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{k.toUpperCase()}</p>
                                        <p className="text-base font-black text-slate-800 mt-1">{String(v)}</p>
                                    </div>
                                ))}
                                {!selectedPatient.vitals && (
                                    <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-xs font-bold text-slate-400">No vitals recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT PANEL - Prescription Builder */}
                        <div className="lg:col-span-7 bg-white border border-slate-100 p-6 lg:p-8 rounded-[2.5rem] shadow-sm">
                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                                <Pill className="text-[#0297d6]" /> Prescription Builder
                            </h3>

                            {/* Medicine Rows */}
                            <div className="space-y-3 mb-4">
                                {medicines.map((med) => (
                                    <div key={med.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl relative group hover:border-[#0297d6]/20 transition-all">
                                        <button
                                            onClick={() => setMedicines(medicines.filter(m => m.id !== med.id))}
                                            className="absolute -right-2 -top-2 bg-white border border-slate-200 text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 shadow transition-all"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="relative">
                                                {manualIds.includes(med.id) ? (
                                                    // Manual input mode
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
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // Search + dropdown mode
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
                                                            <div className="absolute z-50 top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                                                                {/* Other — always on top */}
                                                                <div
                                                                    onMouseDown={() => {
                                                                        toggleManual(med.id);
                                                                        updateMedicine(med.id, 'name', '');
                                                                        setSearchQuery('');
                                                                    }}
                                                                    className="px-4 py-2.5 text-sm font-black text-[#0297d6] hover:bg-[#0297d6]/10 cursor-pointer border-b border-slate-100 flex items-center gap-2"
                                                                >
                                                                    ✏️ Other (type manually)
                                                                </div>

                                                                {/* Filtered results */}
                                                                {MEDICINE_OPTIONS.filter(m =>
                                                                    m.toLowerCase().includes(searchQuery.toLowerCase())
                                                                ).length > 0 ? (
                                                                    MEDICINE_OPTIONS.filter(m =>
                                                                        m.toLowerCase().includes(searchQuery.toLowerCase())
                                                                    ).map((option) => (
                                                                        <div
                                                                            key={option}
                                                                            onMouseDown={() => {
                                                                                updateMedicine(med.id, 'name', option);
                                                                                setSearchQuery('');
                                                                            }}
                                                                            className="px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-[#0297d6]/10 hover:text-[#0297d6] cursor-pointer"
                                                                        >
                                                                            {option}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-3 text-xs text-slate-400 font-bold uppercase">
                                                                        No match — use "Other" above
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Show selected name as a tag if already picked */}
                                                        {med.name && !searchQuery && (
                                                            <div className="mt-1.5 flex items-center gap-2">
                                                                <span className="text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                                                                    {med.name}
                                                                </span>
                                                                <button
                                                                    onMouseDown={() => {
                                                                        updateMedicine(med.id, 'name', '');
                                                                        setSearchQuery('');
                                                                    }}
                                                                    className="text-[10px] text-slate-400 hover:text-red-400 font-black"
                                                                >
                                                                    ✕ clear
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex gap-1">
                                                <input
                                                    placeholder="Qty"
                                                    type="number"
                                                    min="0"
                                                    className="w-20 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0297d6] font-bold text-sm"
                                                    value={splitDosage(med.dosage ?? '').num}
                                                    onChange={(e) => updateMedicine(med.id, 'dosage', `${e.target.value} ${splitDosage(med.dosage ?? '').unit}`.trim())}
                                                />
                                                <select
                                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-sm"
                                                    value={splitDosage(med.dosage ?? '').unit}
                                                    onChange={(e) => updateMedicine(med.id, 'dosage', `${splitDosage(med.dosage ?? '').num} ${e.target.value}`.trim())}
                                                >
                                                    {DOSAGE_UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex gap-1">
                                                <input
                                                    placeholder="Qty"
                                                    type="number"
                                                    min="0"
                                                    className="w-20 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0297d6] font-bold text-sm"
                                                    value={splitDuration(med.duration ?? '').num}
                                                    onChange={(e) => updateMedicine(med.id, 'duration', `${e.target.value} ${splitDuration(med.duration ?? '').unit}`.trim())}
                                                />
                                                <select
                                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-sm"
                                                    value={splitDuration(med.duration ?? '').unit}
                                                    onChange={(e) => updateMedicine(med.id, 'duration', `${splitDuration(med.duration ?? '').num} ${e.target.value}`.trim())}
                                                >
                                                    {DURATION_UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                                                </select>
                                            </div>
                                            {/* <select
                                                className="p-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-sm"
                                                value={med.meal}
                                                onChange={(e) => updateMedicine(med.id, 'meal', e.target.value)}
                                            >
                                                <option>After Meal</option>
                                                <option>Before Meal</option>
                                            </select> */}
                                        </div>
                                        <div className="flex gap-4 items-center pl-1 flex-wrap">
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
                                className="mb-4 bg-[#0297d6]/10 text-[#0297d6] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#0297d6]/20 transition-all"
                            >
                                + Add Medicine
                            </button>
                            {/* Diagnosis Section */}
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Add Diagnosis</p>
                                {diagnoses.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {diagnoses.filter(d => d !== 'Other').map((d, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                                                {d.startsWith('Other:') ? `Other: ${d.slice(6)}` : d}
                                                <button onClick={() => {
                                                    const val = diagnoses.filter(d => d !== 'Other')[i];
                                                    setDiagnoses(diagnoses.filter((_, j) => diagnoses.filter(d => d !== 'Other')[i] !== diagnoses[j]));
                                                    if (val?.startsWith('Other:')) setDiagnosisOther('');
                                                }} className="hover:text-red-400">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-0 text-left bg-slate-50/50">
                                            <div className="flex flex-wrap gap-1 py-1">
                                                {diagnoses.length > 0 ? (
                                                    diagnoses.map((d) => (
                                                        <span key={d} className="bg-[#0297d6]/10 text-[#0297d6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20">{d}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Search diagnosis...</span>
                                                )}
                                            </div>
                                            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search diagnosis..." />
                                            <CommandList>
                                                <CommandGroup className="max-h-60 overflow-y-auto">
                                                    {DIAGNOSIS_OPTIONS.map((option) => (
                                                        <CommandItem
                                                            key={option}
                                                            onSelect={() => {
                                                                setDiagnoses(prev =>
                                                                    prev.includes(option)
                                                                        ? prev.filter(d => d !== option)
                                                                        : [...prev, option]
                                                                );
                                                            }}
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
                                                            if (hasOther) {
                                                                setDiagnoses(prev => prev.filter(d => d !== 'Other' && !d.startsWith('Other:')));
                                                                setDiagnosisOther('');
                                                            } else {
                                                                setDiagnoses(prev => [...prev, 'Other']);
                                                                setDiagnosisOther('');
                                                            }
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
                                            onChange={(e) => {
                                                setDiagnosisOther(e.target.value);
                                                handleOtherInput(e.target.value, setDiagnoses);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                setDiagnoses(prev => prev.filter(d => d !== 'Other' && !d.startsWith('Other:')));
                                                setDiagnosisOther('');
                                            }}
                                            className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black"
                                        >✕</button>
                                    </div>
                                )}
                            </div>

                            {/* Lab Tests Section */}
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lab Tests</p>
                                {labTest.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {labTest.filter(t => t !== 'Other').map((t, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                                                {t.startsWith('Other:') ? `Other: ${t.slice(6)}` : t}
                                                <button onClick={() => {
                                                    const val = labTest.filter(t => t !== 'Other')[i];
                                                    setlabTest(labTest.filter((_, j) => labTest.filter(t => t !== 'Other')[i] !== labTest[j]));
                                                    if (val?.startsWith('Other:')) setLabTestOther('');
                                                }} className="hover:text-red-400">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-0 text-left bg-slate-50/50">
                                            <div className="flex flex-wrap gap-1 py-1">
                                                {labTest.length > 0 ? (
                                                    labTest.map((t) => (
                                                        <span key={t} className="bg-[#0297d6]/10 text-[#0297d6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20">{t}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Search lab tests...</span>
                                                )}
                                            </div>
                                            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search lab test..." />
                                            <CommandList>
                                                <CommandGroup className="max-h-60 overflow-y-auto">
                                                    {LAB_TEST_OPTIONS.map((option) => (
                                                        <CommandItem
                                                            key={option}
                                                            onSelect={() => {
                                                                setlabTest(prev =>
                                                                    prev.includes(option)
                                                                        ? prev.filter(t => t !== option)
                                                                        : [...prev, option]
                                                                );
                                                            }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <div className={`flex h-4 w-4 items-center justify-center rounded border border-primary ${labTest.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"}`}>
                                                                {labTest.includes(option) && <Check className="h-3 w-3" />}
                                                            </div>
                                                            <span>{option}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {(labTest.includes('Other') || labTest.some(t => t.startsWith('Other:'))) && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            autoFocus
                                            placeholder="Specify other lab test..."
                                            className="flex-1 p-3 bg-white border-2 border-[#0297d6] rounded-xl outline-none font-bold text-sm"
                                            value={labTestOther}
                                            onChange={(e) => {
                                                setLabTestOther(e.target.value);
                                                handleOtherInput(e.target.value, setlabTest);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                setlabTest(prev => prev.filter(t => t !== 'Other' && !t.startsWith('Other:')));
                                                setLabTestOther('');
                                            }}
                                            className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black"
                                        >✕</button>
                                    </div>
                                )}
                            </div>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Clinical remarks, lifestyle advice..."
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#0297d6] focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm mb-6"
                            />

                            <div className="flex gap-3 print:hidden">
                                <button
                                    onClick={() => setPrescriptionGenerated(true)}
                                    className="flex-1 bg-[#0297d6] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0297d6]/80 transition-all"
                                >
                                    <Pill size={16} /> Generate Prescription
                                </button>
                                <button
                                    disabled={endingSession}
                                    onClick={async () => {
                                        if (!selectedPatient) return;
                                        setEndingSession(true);
                                        try {
                                            await apiService.savePrescription({
                                                patientId: selectedPatient.id,
                                                token: selectedPatient.token,
                                                diagnosis: diagnoses.length > 0 ? diagnoses.join(', ') : selectedPatient.symptoms,
                                                labTest: labTest.length > 0 ? labTest.join(', ') : null,
                                                clinicalNotes: notes,
                                                medicines: medicines.filter(m => m.name && m.name.trim() !== '')
                                            });
                                            onSessionEnd(selectedPatient);
                                        } catch (err: any) {
                                            console.error(err);
                                            setEndingSession(false);
                                        }
                                    }}
                                    className="flex-1 bg-slate-200 disabled:opacity-60 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-300 transition-all"
                                >
                                    {endingSession ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : 'End Session'}
                                </button>
                            </div>

                            {/* Printable Prescription */}
                            {prescriptionGenerated && (
                                <>
                                    <div id="prescription-paper" className="bg-white border border-slate-100 rounded-2xl p-6 mt-6 mb-4 print:shadow-none">
                                        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-5">
                                            <div className="flex items-center gap-3">
                                                <img src="/logo2.png" alt="EZShifa" className="h-18 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-slate-700 uppercase tracking-widest">Prescription</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">EZShifa Digital Health</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-5xl font-black text-slate-200 italic leading-none">Rx</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Date: {new Date().toLocaleDateString()}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Token: #{selectedPatient.token}</p>
                                            </div>
                                        </div>

                                        <div className="mb-5 space-y-3 border-b border-slate-100 pb-5">
                                            <div className="flex items-end gap-2">
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Patient Name:</span>
                                                <span className="flex-1 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">
                                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                                </span>
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap ml-4">Date:</span>
                                                <span className="w-28 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">
                                                    {new Date().toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Age:</span>
                                                <span className="w-20 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.age} Yrs</span>
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap ml-4">Gender:</span>
                                                <span className="w-24 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.gender}</span>
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap ml-4">Weight:</span>
                                                <span className="w-24 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.vitals.weight}</span>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Diagnosis:</span>
                                                <span className="flex-1 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">
                                                    {diagnoses.length > 0 ? diagnoses.join(', ') : selectedPatient.symptoms}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Lab Tests:</span>
                                                <span className="flex-1 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">
                                                    {labTest.length > 0 ? labTest.join(', ') : "No Test required"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right mb-4">
                                            <p className="text-[9px] font-black text-[#0297d6] uppercase tracking-widest">Attending Physician</p>
                                            <p className="font-black text-slate-800">{fullName}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase">{doctor.specializations.join(', ')}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{doctor.qualifications.join(', ')}</p>
                                        </div>

                                        <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                                                    <tr>
                                                        <th className="px-4 py-3">Medicine</th>
                                                        <th className="px-4 py-3">Dosage</th>
                                                        <th className="px-4 py-3">Duration</th>
                                                        <th className="px-4 py-3 text-center">M — A — N</th>
                                                        <th className="px-4 py-3">Instructions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {medicines.filter(m => m.name).map((m, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-3 font-black text-sm text-slate-800">{m.name}</td>
                                                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{m.dosage || '—'}</td>
                                                            <td className="px-4 py-3 text-xs font-bold text-slate-600">{m.duration || '—'}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex justify-center gap-1">
                                                                    {[m.morning, m.afternoon, m.night].map((active, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold border ${active ? 'bg-[#0297d6] border-[#0297d6] text-white' : 'border-slate-200 text-slate-300'
                                                                                }`}
                                                                        >
                                                                            {active ? '1' : '0'}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-bold text-[#0297d6] italic uppercase">{m.meal}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {notes && (
                                            <div className="p-4 bg-blue-50/50 border-l-4 border-[#0297d6] rounded-r-xl mb-4">
                                                <p className="text-[10px] font-black text-[#0297d6] uppercase tracking-widest mb-1">Clinical Notes</p>
                                                <p className="text-sm italic text-slate-700 font-medium">{notes}</p>
                                            </div>
                                        )}

                                        <div className="border-t pt-4 flex justify-between items-center opacity-50">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">System Generated — EZShifa Digital Health</p>
                                            <div className="h-10 w-24 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center">
                                                <span className="text-[8px] text-slate-400 font-bold uppercase">Doctor's Stamp</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 print:hidden">
                                        <button
                                            onClick={handlePrescriptionPrint}
                                            disabled={isPrinting}
                                            className={`flex-1 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all
                                            ${isPrinting
                                                    ? "bg-slate-400 cursor-not-allowed"
                                                    : "bg-slate-900 hover:bg-[#0297d6] active:scale-95"
                                                }`}
                                        >
                                            {isPrinting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer size={16} />
                                                    Print Rx
                                                </>
                                            )}
                                        </button>
                                        <div className="relative flex-1">
                                            {/* Trigger Button */}
                                            <button
                                                onClick={() => setIsOpenPrescriptionSend(!isOpenPrescriptionSend)}
                                                className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                                            >
                                                Actions
                                                {/* Simple chevron icon to indicate dropdown */}
                                                <span className={`transition-transform ${isOpenPrescriptionSend ? 'rotate-180' : ''}`}>▼</span>
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isOpenPrescriptionSend && (
                                                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                                                    <button
                                                        onClick={() => { console.log("Save PDF logic"); setIsOpenPrescriptionSend(false); }}
                                                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        Save PDF
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDispense(); // <--- Call the bridge here
                                                            setIsOpenPrescriptionSend(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 border-t border-slate-100 transition-colors"
                                                    >
                                                        Dispense
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Global Print Styles */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: white; }
        @media print {
          body * { visibility: hidden; }
          #prescription-paper, #prescription-paper * { visibility: visible; }
          #prescription-paper {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 20px !important;
            box-shadow: none !important; border: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
        </div>
    );
};

export default DocConsult;