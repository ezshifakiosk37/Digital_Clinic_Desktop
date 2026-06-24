"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
    Printer, Bluetooth, BluetoothConnected, BluetoothOff, RefreshCw, X, Wifi
} from 'lucide-react';
import { BluetoothPrinter, BluetoothPrinterModalProps, PrinterModalStep } from '@/app/_utils/types';

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
    isOpen,
    onClose,
    onPrint,
    isPrinting,
}) => {
    const [step, setStep] = useState<PrinterModalStep>('list');
    const [printers, setPrinters] = useState<BluetoothPrinter[]>([]);
    const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState<BluetoothPrinter | null>(null);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [noAndroid, setNoAndroid] = useState(false);

    // ── Register Android → Web callbacks ──────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        // Called by Kotlin when paired printers are ready
        (window as any).onPrintersLoaded = (jsonStr: string) => {
            setIsLoadingPrinters(false);
            try {
                const payload = JSON.parse(jsonStr) as { error: string | null; devices: BluetoothPrinter[] };
                if (payload.error) {
                    setConnectionError(payload.error === 'PERMISSION_DENIED'
                        ? 'Bluetooth permission denied. Please allow it in Android settings.'
                        : payload.error);
                } else {
                    setPrinters(payload.devices);
                }
            } catch {
                setConnectionError('Failed to parse printer list.');
            }
        };

        // Called by Kotlin when selectPrinter() completes
        (window as any).onPrinterSelected = (success: boolean, message: string) => {
            if (success) {
                setStep('ready');
                setConnectionError(null);
            } else {
                setStep('list');
                setConnectionError(message || 'Could not connect to printer.');
            }
        };

        return () => {
            delete (window as any).onPrintersLoaded;
            delete (window as any).onPrinterSelected;
        };
    }, [isOpen]);

    // ── Listen for print result from Android ──────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        (window as any).onPrintResult = (success: boolean, message: string) => {
            if (success) {
                setStep('list')
                onClose()  // ← auto close on success
            } else {
                setStep('ready')  // ← go back to ready so user can retry
                setConnectionError(message || 'Print failed. Try again.')
            }
        };

        return () => {
            delete (window as any).onPrintResult;
        };
    }, [isOpen, onClose]);

    // ── Auto-fetch on open ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setStep('list');
        setSelectedPrinter(null);
        setConnectionError(null);
        fetchPrinters();
    }, [isOpen]);

    const fetchPrinters = () => {
        setIsLoadingPrinters(true);
        setConnectionError(null);
        setPrinters([]);

        if (!(window as any).AndroidNative) {
            setNoAndroid(true);
            setIsLoadingPrinters(false);
            // Simulate printers for dev environment
            setTimeout(() => {
                setPrinters([
                    { name: 'Bluetooth Printer (Sim)', address: 'AA:BB:CC:DD:EE:01' },
                    { name: 'MPT-II Printer (Sim)', address: 'AA:BB:CC:DD:EE:02' },
                ]);
            }, 800);
            return;
        }
        setNoAndroid(false);
        (window as any).AndroidNative.getPairedPrinters();
    };

    const handleSelectPrinter = (printer: BluetoothPrinter) => {
        setSelectedPrinter(printer);
        setConnectionError(null);
        setStep('connecting');

        if (!(window as any).AndroidNative) {
            // Simulate connection in dev
            setTimeout(() => setStep('ready'), 1200);
            return;
        }
        (window as any).AndroidNative.selectPrinter(printer.address);
    };

    const handlePrint = () => {
        setStep('printing');
        onPrint();
    };

    if (!isOpen) return null;

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal Card */}
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#0297d6]/10 rounded-xl flex items-center justify-center">
                            <Bluetooth size={18} className="text-[#0297d6]" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800">Select Printer</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {step === 'list' && 'Paired Devices'}
                                {step === 'connecting' && 'Connecting…'}
                                {step === 'ready' && 'Ready to Print'}
                                {step === 'printing' && 'Sending to Printer…'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={14} className="text-slate-500" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="px-6 py-5 min-h-[220px] flex flex-col">

                    {/* DEV warning */}
                    {noAndroid && (
                        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                ⚠ No Android Bridge — Simulated Mode
                            </p>
                        </div>
                    )}

                    {/* ── STEP: list ── */}
                    {step === 'list' && (
                        <>
                            {/* Error banner */}
                            {connectionError && (
                                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{connectionError}</p>
                                </div>
                            )}

                            {/* Loading skeleton */}
                            {isLoadingPrinters ? (
                                <div className="flex-1 flex flex-col gap-3 justify-center">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                    ))}
                                </div>
                            ) : printers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-6">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-1">
                                        <BluetoothOff size={28} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-500">No Paired Printers</p>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        Pair your printer in Android Bluetooth settings first.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
                                    {printers.map((printer) => (
                                        <button
                                            key={printer.address}
                                            onClick={() => handleSelectPrinter(printer)}
                                            className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-[#0297d6]/5 border-2 border-transparent hover:border-[#0297d6]/30 rounded-2xl transition-all text-left group"
                                        >
                                            <div className="w-9 h-9 bg-white border border-slate-200 group-hover:border-[#0297d6]/30 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                                <Printer size={16} className="text-slate-400 group-hover:text-[#0297d6] transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate">{printer.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{printer.address}</p>
                                            </div>
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-[#0297d6] transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Refresh button */}
                            <button
                                onClick={fetchPrinters}
                                disabled={isLoadingPrinters}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 hover:border-[#0297d6]/40 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0297d6] transition-all disabled:opacity-40"
                            >
                                <RefreshCw size={12} className={isLoadingPrinters ? 'animate-spin' : ''} />
                                Refresh List
                            </button>
                        </>
                    )}

                    {/* ── STEP: connecting ── */}
                    {step === 'connecting' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
                            {/* Animated ring */}
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-[#0297d6]/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0297d6] animate-spin" />
                                <Bluetooth size={28} className="text-[#0297d6]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-800">Connecting</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    {selectedPrinter?.name}
                                </p>
                                <p className="text-[10px] font-mono text-slate-300 mt-1">
                                    {selectedPrinter?.address}
                                </p>
                            </div>
                            <button
                                onClick={() => { setStep('list'); setSelectedPrinter(null); }}
                                className="text-[11px] font-black text-slate-400 hover:text-red-400 uppercase tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* ── STEP: ready ── */}
                    {step === 'ready' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
                            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center">
                                <BluetoothConnected size={30} className="text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-800">Connected!</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedPrinter?.name}</p>
                            </div>

                            {/* Print button */}
                            <button
                                onClick={handlePrint}
                                disabled={isPrinting}
                                className="w-full mt-2 bg-[#0297d6] disabled:bg-slate-300 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0288c2] active:scale-[0.98] transition-all"
                            >
                                <Printer size={15} />
                                Print Prescription
                            </button>

                            <button
                                onClick={() => { setStep('list'); setSelectedPrinter(null); }}
                                className="text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                ← Change Printer
                            </button>
                        </div>
                    )}

                    {/* ── STEP: printing ── */}
                    {step === 'printing' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4">
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-[#0297d6]/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0297d6] animate-spin" />
                                <Printer size={28} className="text-[#0297d6]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-800">Sending to Printer…</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedPrinter?.name}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};