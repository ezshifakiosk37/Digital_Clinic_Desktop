'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiService } from '@/app/_utils/apiService';

interface EcgReportModalProps {
    onClose: () => void;
    vitalsId: string;
}

export function EcgReportModal({ onClose, vitalsId }: EcgReportModalProps) {
    const [ecgLink, setEcgLink] = useState<string | null>(null);
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEcg = async () => {
            try {
                const data = await apiService.getRapidTesting(vitalsId);
                console.log(data.data.ecgLink)
                const link = data?.data.ecgLink;
                if (link && link !== 'Not Performed') {
                    setEcgLink(link);
                } else {
                    setError('No ECG report available for this patient.');
                }
            } catch (err) {
                setError('Failed to fetch ECG report.');
            } finally {
                setIsFetching(false);
            }
        };
        fetchEcg();
    }, [vitalsId]);

    return (
        <div className="fixed inset-0 md:inset-y-0 md:left-16 md:right-0 z-50 bg-black/75 p-4 flex items-center justify-center">
            <div className="relative bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b">
                    <h3 className="text-lg font-semibold">ECG Report</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-2 relative overflow-hidden">
                    {/* Fetching from DB */}
                    {isFetching && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                            <svg className="animate-spin w-8 h-8 text-[#0297d6]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <p className="text-sm text-slate-500 font-medium">Fetching ECG Report…</p>
                        </div>
                    )}

                    {/* Error */}
                    {!isFetching && error && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-slate-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* PDF Loader */}
                    {!isFetching && ecgLink && isIframeLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                            <svg className="animate-spin w-8 h-8 text-[#0297d6]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            <p className="text-sm text-slate-500 font-medium">Loading ECG Report…</p>
                        </div>
                    )}

                    {/* iFrame */}
                    {!isFetching && ecgLink && (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(ecgLink)}&embedded=true`}
                            className="w-full h-full"
                            title="ECG Report"
                            onLoad={() => setIsIframeLoading(false)}
                        />
                    )}
                </div>

                {/* Footer */}
                {!isFetching && ecgLink && (
                    <div className="text-center p-2 border-t">
                        <a
                            href={ecgLink}
                            download="ecg_report.pdf"
                            className="text-xs text-[#0297d6] hover:underline"
                        >
                            Download PDF
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}