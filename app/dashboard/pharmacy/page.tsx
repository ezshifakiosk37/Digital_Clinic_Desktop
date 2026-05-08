'use client'
import { Activity, Loader2, Pill, Printer } from 'lucide-react'
import React, { useState, useEffect, useCallback } from 'react'
import { apiService } from '@/app/_utils/apiService';
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';
import type { PrescriptionWithPatient } from "@/app/_utils/types";
import { BluetoothPrinterModal } from '../consultation/components/BluetoothPrinterModel';

const Page = () => {

    const [queue, setQueue] = useState<PrescriptionWithPatient[]>([]);
    const [search, setSearch] = useState("");
    const [expandedToken, setExpandedToken] = useState<string | null>(null);
    const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
    const [isOpenActions, setIsOpenActions] = useState(false);
    const [isDispensing, setIsDispensing] = useState(false);

    // ── Load today's prescriptions via apiService ──────────────────────────────
    useEffect(() => {
        const loadQueue = async () => {
            const token = localStorage.getItem("token");
            if (!token) return console.warn("[Queue] No staff token found.");
            try {
                const res = await apiService.getAllPrescription(token);
                setQueue(res.data || []);
            } catch (err) {
                console.error("[Queue] Failed to load prescriptions:", err);
            }
        };
        loadQueue();
    }, []);

    // ── Reset expanded-row UI whenever a different row is opened ───────────────
    useEffect(() => {
        setPrescriptionGenerated(false);
        setIsPrinterModalOpen(false);
        setIsOpenActions(false);
    }, [expandedToken]);

    // ── Android print callback ─────────────────────────────────────────────────
    useEffect(() => {
        (window as any).onPrintResult = (success: boolean, message: string) => {
            setIsPrinting(false);
            if (success) setIsPrinterModalOpen(false);
            else alert(`Print failed: ${message}`);
        };
        return () => { delete (window as any).onPrintResult; };
    }, []);

    // ── Filtered queue ─────────────────────────────────────────────────────────
    const filteredPrescriptions = queue.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const full = `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.toLowerCase();
        const rev = `${item.patient.lastName || ""} ${item.patient.firstName || ""}`.toLowerCase();
        return full.includes(q) || rev.includes(q) || String(item.token || "").toLowerCase().includes(q);
    });

    // ── Print ──────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!(window as any).AndroidNative) { window.print(); return; }
        setIsPrinterModalOpen(true);
    };

    const executePrint = useCallback(() => {
        const p = queue.find(q => q.token === expandedToken);
        if (!p) return;

        setIsPrinting(true);
        setTimeout(() => {
            try {
                if (!(window as any).AndroidNative) {
                    window.print();
                    setIsPrinting(false);
                    return;
                }

                const printPayload = {
                    clinicName: "EZShifa Digital Health",
                    date: new Date().toLocaleDateString(),
                    token: p.token || "N/A",
                    patient: {
                        name: `${p.patient.firstName} ${p.patient.lastName}`,
                        ageSex: `${p.patient.age ?? ""}Y / ${p.patient.gender ?? ""}`,
                    },
                    diagnosis: p.diagnosis || "N/A",
                    labTests: p.labTest
                        ? p.labTest.split(',').map((t: string) => t.trim()).filter(Boolean)
                        : [],
                    notes: p.clinicalNotes || "",
                    medicines: (p.medicines ?? [])
                        .filter((m: any) => m.medicineName?.trim())
                        .map((m: any) => ({
                            name: m.medicineName,
                            dosage: m.dosage || "",
                            duration: m.duration || "",
                            schedule: `${m.morning ? 1 : 0}-${m.afternoon ? 1 : 0}-${m.night ? 1 : 0}`,
                        })),
                };

                (window as any).AndroidNative.printThermal(JSON.stringify(printPayload));
            } catch (err) {
                console.error("[Print] Mapping error:", err);
                alert("Failed to prepare prescription for printing.");
                setIsPrinting(false);
            }
        }, 150);
    }, [queue, expandedToken]);

    // ── Save PDF (system print dialog → browser saves as PDF) ─────────────────
    const handleSavePdf = () => {
        window.print();
        setIsOpenActions(false);
    };

    // ── Dispense via apiService.endCall (reuses the vitalsId from prescription) ─
    // If your backend has a dedicated dispense endpoint, swap this out below.
    const handleDispense = async () => {
        const p = queue.find(q => q.token === expandedToken);
        if (!p) return;

        // Try hardware first
        const hardwareOk = AndroidBridge.dispenseMedicine(2, 4, 6);

        // Then mark the call/visit as ended on the backend so stock is logged
        if (!hardwareOk) {
            setIsDispensing(true);
            try {
                // apiService.endCall accepts a vitalsId — reuse it as the dispense hook.
                // Replace with a dedicated dispense endpoint if your API has one.
                await apiService.endCall(String(p.patient.id), "dispensed");
            } catch (err) {
                console.error("[Dispense] API call failed:", err);
            } finally {
                setIsDispensing(false);
            }
        }

        setIsOpenActions(false);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen bg-slate-50">

            <BluetoothPrinterModal
                isOpen={isPrinterModalOpen}
                onClose={() => { if (!isPrinting) setIsPrinterModalOpen(false); }}
                onPrint={executePrint}
                isPrinting={isPrinting}
            />

            {/* Header */}
            <div className="w-full bg-[#0297d6] text-white">
                <div className="max-w-5xl mx-auto flex items-center gap-3 min-w-0">
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm shrink-0">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">EZShifa</h1>
                        <span className="opacity-50 text-sm shrink-0">|</span>
                        <p className="opacity-80 text-md truncate">Site: EZShifa • Digital Health Clinic</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">

                    {/* Table header + search */}
                    <div className="px-8 py-4 border-b flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                        <h2 className="font-bold text-xl text-slate-800">CURRENT MEDICATION QUEUE</h2>
                        <div className="flex gap-3 w-full lg:w-auto">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by token or name..."
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full lg:w-64 focus:outline-none focus:border-[#0297d6]"
                            />
                            <button
                                onClick={() => setSearch("")}
                                className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="text-sm text-slate-500 font-semibold">
                                <th className="px-8 py-4 text-left">SR. NO</th>
                                <th className="px-8 py-4 text-left">TOKEN NUMBER</th>
                                <th className="px-8 py-4 text-left">Name</th>
                                <th className="px-8 py-4 text-left">Phone Number</th>
                                <th className="px-8 py-4 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredPrescriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm">
                                        No patients found{search && ` matching "${search}"`}
                                    </td>
                                </tr>
                            ) : (
                                filteredPrescriptions.map((p, i) => {
                                    const isExpanded = expandedToken === p.token;
                                    const labTestDisplay = p.labTest
                                        ? p.labTest.split(',').map((t: string) => t.trim()).filter(Boolean)
                                        : [];

                                    return (
                                        <React.Fragment key={p.id}>

                                            {/* ── Main row ── */}
                                            <tr className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-5 text-slate-600 font-medium">{i + 1}</td>
                                                <td className="px-8 py-5 font-bold text-[#0297d6]">#{p.token}</td>
                                                <td className="px-8 py-5 text-slate-700">
                                                    {p.patient.firstName} {p.patient.lastName}
                                                </td>
                                                <td className="px-8 py-5 text-slate-700">{p.patient.phoneNumber}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => setExpandedToken(isExpanded ? null : p.token)}
                                                        className="bg-[#0297d6] hover:bg-[#0288c2] text-white px-6 py-2 rounded-xl text-sm font-bold"
                                                    >
                                                        {isExpanded ? "CLOSE" : "VIEW"}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* ── Expanded row ── */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-6 bg-slate-50">
                                                        <div className="space-y-5">

                                                            {/* Patient info card */}
                                                            <div className="bg-white rounded-2xl border border-slate-100 p-5">
                                                                <p className="font-bold text-slate-800 text-base mb-1">
                                                                    {p.patient.firstName} {p.patient.lastName}
                                                                </p>
                                                                <p className="text-sm text-slate-500">Phone: {p.patient.phoneNumber}</p>
                                                                <p className="text-sm text-slate-500">Diagnosis: {p.diagnosis || "N/A"}</p>
                                                                {labTestDisplay.length > 0 && (
                                                                    <p className="text-sm text-slate-500">
                                                                        Lab Tests: {labTestDisplay.join(', ')}
                                                                    </p>
                                                                )}
                                                                {p.clinicalNotes && (
                                                                    <p className="text-sm text-slate-500">Notes: {p.clinicalNotes}</p>
                                                                )}
                                                            </div>

                                                            {/* Generate prescription button */}
                                                            {!prescriptionGenerated && (
                                                                <button
                                                                    onClick={() => setPrescriptionGenerated(true)}
                                                                    className="w-full bg-[#0297d6] text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0288c2] transition-all"
                                                                >
                                                                    <Pill size={15} /> Generate Prescription
                                                                </button>
                                                            )}

                                                            {/* ── Printable prescription slip ── */}
                                                            {prescriptionGenerated && (
                                                                <>
                                                                    <div className="flex justify-center">
                                                                        <div
                                                                            id="prescription-paper"
                                                                            className="bg-white border border-slate-200 rounded-2xl shadow-sm leading-tight text-slate-900"
                                                                            style={{ fontFamily: 'monospace', width: '320px', padding: '16px' }}
                                                                        >
                                                                            {/* Header */}
                                                                            <div className="text-center border-b-2 border-black pb-2 mb-3">
                                                                                <img src="/logo2.png" alt="EZShifa" className="h-12 mx-auto mb-1" />
                                                                                <p className="text-sm font-black uppercase tracking-widest">Prescription</p>
                                                                                <p className="text-[10px] font-bold">EZShifa Digital Health</p>
                                                                            </div>

                                                                            {/* Patient info */}
                                                                            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-black uppercase">Name:</span>
                                                                                    <span className="font-bold">{p.patient.firstName} {p.patient.lastName}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-black uppercase">Date:</span>
                                                                                    <span>{new Date().toLocaleDateString()}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-black uppercase">Token:</span>
                                                                                    <span>#{p.token}</span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Diagnosis */}
                                                                            <div className="border-b border-dashed border-slate-300 pb-3 mb-3 text-[11px]">
                                                                                <p className="font-black uppercase text-[9px] tracking-widest mb-0.5">Diagnosis</p>
                                                                                <p className="italic">{p.diagnosis || 'N/A'}</p>
                                                                            </div>

                                                                            {/* Rx */}
                                                                            <div className="mb-3">
                                                                                <p className="text-lg font-black italic mb-2">Rx</p>
                                                                                {(p.medicines ?? []).filter((m: any) => m.medicineName).length === 0
                                                                                    ? <p className="text-[10px] text-slate-400 italic">No medicines prescribed.</p>
                                                                                    : (
                                                                                        <div className="space-y-3">
                                                                                            {(p.medicines ?? []).filter((m: any) => m.medicineName).map((m: any, idx: number) => (
                                                                                                <div key={m.id} className="border-b border-slate-100 pb-2">
                                                                                                    <p className="text-[11px] font-black uppercase">{idx + 1}. {m.medicineName}</p>
                                                                                                    <div className="flex justify-between text-[10px] mt-0.5">
                                                                                                        <span>{m.dosage || '—'} · {m.duration || '—'}</span>
                                                                                                        <span className="font-bold">
                                                                                                            M:{m.morning ? '1' : '0'} A:{m.afternoon ? '1' : '0'} N:{m.night ? '1' : '0'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                            </div>

                                                                            {/* Lab tests */}
                                                                            {labTestDisplay.length > 0 && (
                                                                                <div className="border-t border-dashed border-slate-300 pt-3 mb-3 text-[11px]">
                                                                                    <p className="font-black uppercase text-[9px] tracking-widest mb-1">Lab Tests Advised</p>
                                                                                    <ul className="space-y-0.5">
                                                                                        {labTestDisplay.map((t: string, idx: number) => (
                                                                                            <li key={idx} className="flex items-start gap-1">
                                                                                                <span className="text-[#0297d6] font-black mt-0.5">›</span>
                                                                                                <span>{t}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Clinical notes */}
                                                                            {p.clinicalNotes && (
                                                                                <div className="border-t border-dashed border-slate-300 pt-3 mb-3 text-[11px]">
                                                                                    <p className="font-black uppercase text-[9px] tracking-widest mb-0.5">Clinical Notes</p>
                                                                                    <p className="italic text-slate-600">{p.clinicalNotes}</p>
                                                                                </div>
                                                                            )}

                                                                            <div className="mt-4 text-center opacity-40">
                                                                                <p className="text-[8px] uppercase tracking-widest">*** End of Prescription ***</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* ── Action buttons ── */}
                                                                    <div className="flex gap-3 print:hidden">

                                                                        {/* Print Rx */}
                                                                        <button
                                                                            onClick={handlePrint}
                                                                            disabled={isPrinting}
                                                                            className={`flex-1 text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${isPrinting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-[#0297d6] active:scale-95"}`}
                                                                        >
                                                                            {isPrinting
                                                                                ? <><Loader2 size={15} className="animate-spin" />Processing...</>
                                                                                : <><Printer size={15} />Print Rx</>
                                                                            }
                                                                        </button>

                                                                        {/* Actions dropdown */}
                                                                        <div className="relative flex-1">
                                                                            <button
                                                                                onClick={() => setIsOpenActions(v => !v)}
                                                                                className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                                                                            >
                                                                                Actions
                                                                                <span className={`transition-transform inline-block ${isOpenActions ? 'rotate-180' : ''}`}>▼</span>
                                                                            </button>

                                                                            {isOpenActions && (
                                                                                <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">

                                                                                    {/* Save PDF — uses apiService indirectly via window.print() */}
                                                                                    <button
                                                                                        onClick={handleSavePdf}
                                                                                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                                    >
                                                                                        Save PDF
                                                                                    </button>

                                                                                    {/* Dispense — AndroidBridge + apiService.endCall */}
                                                                                    <button
                                                                                        onClick={handleDispense}
                                                                                        disabled={isDispensing}
                                                                                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 border-t border-slate-100 transition-colors disabled:opacity-50"
                                                                                    >
                                                                                        {isDispensing
                                                                                            ? <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" />Dispensing...</span>
                                                                                            : 'Dispense'
                                                                                        }
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #prescription-paper, #prescription-paper * { visibility: visible; }
                    #prescription-paper {
                        position: absolute; left: 50%; top: 0;
                        transform: translateX(-50%);
                        width: 320px !important; padding: 16px !important;
                        box-shadow: none !important; border: none !important;
                    }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </main>
    );
};

export default Page;