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

    // ── Per-expanded prescription state ──
    const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
    const [isOpenPrescriptionSend, setIsOpenPrescriptionSend] = useState(false);

    useEffect(() => {
        const loadQueue = async () => {
            const token = localStorage.getItem("token");
            if (!token) return console.log("User token not found");
            try {
                const res = await apiService.getAllPrescription(token);
                setQueue(res.data || []);
            } catch (err) {
                console.error("Failed to load prescriptions", err);
            }
        };
        loadQueue();
    }, []);

    // Reset prescription state whenever the expanded row changes
    useEffect(() => {
        setPrescriptionGenerated(false);
        setIsPrinterModalOpen(false);
        setIsOpenPrescriptionSend(false);
    }, [expandedToken]);

    useEffect(() => {
        (window as any).onPrintResult = (success: boolean, message: string) => {
            setIsPrinting(false);
            if (success) setIsPrinterModalOpen(false);
            else alert(`Print failed: ${message}`);
        };
        return () => { delete (window as any).onPrintResult; };
    }, []);

    const filteredPrescriptions = queue.filter((item) => {
        if (!search) return true;
        const query = search.toLowerCase();
        const fullName = `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.toLowerCase();
        const reversedName = `${item.patient.lastName || ""} ${item.patient.firstName || ""}`.toLowerCase();
        const token = String(item.token || "").toLowerCase();
        return fullName.includes(query) || reversedName.includes(query) || token.includes(query);
    });

    const handleDispense = () => {
        const success = AndroidBridge.dispenseMedicine(2, 4, 6);
        if (!success) alert("Dispense triggered (Simulated: No Hardware Connected)");
    };

    const handlePrint = () => {
        if (!(window as any).AndroidNative) {
            window.print();
            return;
        }
        setIsPrinterModalOpen(true);
    };

    // Build print payload from the currently expanded prescription
    const executePrint = useCallback(() => {
        setIsPrinting(true);
        const p = queue.find(q => q.token === expandedToken);
        if (!p) { setIsPrinting(false); return; }

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
                    labTests: p.labTest ? p.labTest.split(',').map(t => t.trim()) : [],
                    notes: p.clinicalNotes || "",
                    medicines: (p.medicines ?? [])
                        .filter(m => m.medicineName?.trim())
                        .map(m => ({
                            name: m.medicineName,
                            dosage: m.dosage || "",
                            duration: m.duration || "",
                            schedule: `${m.morning ? 1 : 0}-${m.afternoon ? 1 : 0}-${m.night ? 1 : 0}`,
                        })),
                };

                (window as any).AndroidNative.printThermal(JSON.stringify(printPayload));
            } catch (err) {
                console.error("Print mapping error:", err);
                alert("Failed to prepare prescription for printing.");
                setIsPrinting(false);
            }
        }, 150);
    }, [queue, expandedToken]);

    return (
        <main className="min-h-screen bg-slate-50">

            <BluetoothPrinterModal
                isOpen={isPrinterModalOpen}
                onClose={() => { if (!isPrinting) setIsPrinterModalOpen(false); }}
                onPrint={executePrint}
                isPrinting={isPrinting}
            />

            {/* Header */}
            <div className="w-full bg-[#0297d6] py-6 px-4 text-white">
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

            {/* Page body */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">

                    {/* Table Header */}
                    <div className="px-8 py-4 border-b flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <h2 className="font-bold text-xl text-slate-800 text-nowrap">
                            CURRENT MEDICATION QUEUE
                        </h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by token or name..."
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-[#0297d6]"
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

                                    // Derived values for this prescription
                                    const labTestDisplay = p.labTest
                                        ? p.labTest.split(',').map(t => t.trim()).filter(Boolean)
                                        : [];

                                    return (
                                        <React.Fragment key={p.id}>

                                            {/* ROW */}
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

                                            {/* EXPANDED ROW */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-6 bg-slate-50">
                                                        <div className="space-y-5">

                                                            {/* ── Patient Info ── */}
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

                                                            {/* ── Medicine List ──
                                                            <div className="space-y-2">
                                                                {p.medicines?.map((m) => (
                                                                    <div
                                                                        key={m.id}
                                                                        className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center"
                                                                    >
                                                                        <div>
                                                                            <p className="font-bold text-slate-800">{m.medicineName}</p>
                                                                            <p className="text-xs text-slate-500">{m.dosage} • {m.duration}</p>
                                                                        </div>
                                                                        <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                                                                            M:{m.morning ? 1 : 0} A:{m.afternoon ? 1 : 0} N:{m.night ? 1 : 0}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div> */}

                                                            {/* ── Generate Prescription Button ── */}
                                                            {!prescriptionGenerated && (
                                                                <button
                                                                    onClick={() => setPrescriptionGenerated(true)}
                                                                    className="w-full bg-[#0297d6] text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0288c2] transition-all"
                                                                >
                                                                    <Pill size={15} /> Generate Prescription
                                                                </button>
                                                            )}

                                                            {/* ── PRINTABLE PRESCRIPTION ── */}
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

                                                                            {/* Patient Info */}
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

                                                                            {/* Rx Medicines */}
                                                                            <div className="mb-3">
                                                                                <p className="text-lg font-black italic mb-2">Rx</p>
                                                                                {(p.medicines ?? []).filter(m => m.medicineName).length === 0
                                                                                    ? <p className="text-[10px] text-slate-400 italic">No medicines prescribed.</p>
                                                                                    : (
                                                                                        <div className="space-y-3">
                                                                                            {(p.medicines ?? []).filter(m => m.medicineName).map((m, idx) => (
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

                                                                            {/* Lab Tests */}
                                                                            {labTestDisplay.length > 0 && (
                                                                                <div className="border-t border-dashed border-slate-300 pt-3 mb-3 text-[11px]">
                                                                                    <p className="font-black uppercase text-[9px] tracking-widest mb-1">Lab Tests Advised</p>
                                                                                    <ul className="space-y-0.5">
                                                                                        {labTestDisplay.map((t, idx) => (
                                                                                            <li key={idx} className="flex items-start gap-1">
                                                                                                <span className="text-[#0297d6] font-black mt-0.5">›</span>
                                                                                                <span>{t}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Clinical Notes */}
                                                                            {p.clinicalNotes && (
                                                                                <div className="border-t border-dashed border-slate-300 pt-3 mb-3 text-[11px]">
                                                                                    <p className="font-black uppercase text-[9px] tracking-widest mb-0.5">Clinical Notes</p>
                                                                                    <p className="italic text-slate-600">{p.clinicalNotes}</p>
                                                                                </div>
                                                                            )}

                                                                            {/* Footer */}
                                                                            <div className="text-center mt-4 opacity-40">
                                                                                <p className="text-[8px] uppercase tracking-widest">*** End of Prescription ***</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* ── Action Buttons ── */}
                                                                    <div className="flex gap-3 print:hidden">

                                                                        {/* Print */}
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
                                                                                onClick={() => setIsOpenPrescriptionSend(!isOpenPrescriptionSend)}
                                                                                className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                                                                            >
                                                                                Actions
                                                                                <span className={`transition-transform inline-block ${isOpenPrescriptionSend ? 'rotate-180' : ''}`}>▼</span>
                                                                            </button>

                                                                            {isOpenPrescriptionSend && (
                                                                                <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            window.print();
                                                                                            setIsOpenPrescriptionSend(false);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                                    >
                                                                                        Save PDF
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handleDispense();
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