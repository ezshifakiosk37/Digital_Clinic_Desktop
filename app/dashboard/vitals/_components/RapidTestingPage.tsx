'use client'
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react'
import NavBarTestPages from './NavBarTestPages'
// Dynamically import react-pdf components (client-only)
const PDFDocument = dynamic(
    () => import('react-pdf').then(mod => mod.Document),
    { ssr: false }
);
const PDFPage = dynamic(
    () => import('react-pdf').then(mod => mod.Page),
    { ssr: false }
);
import {
    ChevronDown, Check, ArrowLeft, ArrowRight,
    Activity, Droplets, Shield, Microscope, Bug,
    Zap, Wind, Stethoscope, FlaskConical, TestTube, Heart,
    FileText
} from 'lucide-react'
import ToastPopup from './ToastPopup'
import { apiService } from '@/app/_utils/apiService';

// ─── Types ───────────────────────────────────────────────────────────────────
type TestResult = 'Not Performed' | 'Normal' | 'Consultation Required'

interface TestItem {
    id: string
    label: string
    result: TestResult
}

interface BloodSugar {
    value: string
    type: 'Random' | 'Fasting'
}

interface MoreTest {
    id: string
    label: string
    normalRange: string
    value: string
}

export interface RapidTestingData {
    bloodSugar: BloodSugar
    tests: TestItem[]
    moreTests: MoreTest[]
    ecgLink: string
}

// ─── Constants ───────────────────────────────────────────────────────────────
const RESULT_OPTIONS: TestResult[] = ['Not Performed', 'Normal', 'Consultation Required']

const TEST_ICONS: Record<string, React.ReactNode> = {
    ecg: <Activity className="w-7 h-7 text-[#0297d6]" />,
    hiv: <Shield className="w-7 h-7 text-[#0297d6]" />,
    hepatitis: <Droplets className="w-7 h-7 text-[#0297d6]" />,
    hbsag: <FlaskConical className="w-7 h-7 text-[#0297d6]" />,
    hcvab: <TestTube className="w-7 h-7 text-[#0297d6]" />,
    hiv12ab: <Shield className="w-7 h-7 text-[#0297d6]" />,
    dengue: <Bug className="w-7 h-7 text-[#0297d6]" />,
    syphilis: <Microscope className="w-7 h-7 text-[#0297d6]" />,
    typhoid: <Zap className="w-7 h-7 text-[#0297d6]" />,
    tb: <Wind className="w-7 h-7 text-[#0297d6]" />,
    malaria: <Bug className="w-7 h-7 text-[#0297d6]" />,
}

const MORE_ICONS: Record<string, React.ReactNode> = {
    hemoglobin: <Droplets className="w-7 h-7 text-[#0297d6]" />,
    cholesterol: <Heart className="w-7 h-7 text-[#0297d6]" />,
    bodyfat: <Activity className="w-7 h-7 text-[#0297d6]" />,
}

const DEFAULT_TESTS: TestItem[] = [
    { id: 'ecg', label: 'ECG', result: 'Not Performed' }, //Electrocardiogram
    { id: 'hiv', label: 'HIV', result: 'Not Performed' }, //Human Immunodeficiency Virus
    { id: 'hepatitis', label: 'Hepatitis', result: 'Not Performed' }, // Hepatitis
    { id: 'hbsag', label: 'HBsAg', result: 'Not Performed' }, //hbsag: "Hepatitis B Surface Antigen",
    { id: 'hcvab', label: 'HCV Ab', result: 'Not Performed' }, //Hepatitis C Virus Antibody
    { id: 'hiv12ab', label: 'HIV ½ Ab', result: 'Not Performed' }, //Human Immunodeficiency Virus Type 1 and Type 2 Antibody
    { id: 'dengue', label: 'Dengue NS1 Ag', result: 'Not Performed' }, //Dengue Non-Structural Protein 1 Antigen
    { id: 'syphilis', label: 'Syphilis Ab', result: 'Not Performed' }, //Syphilis Antibody
    { id: 'typhoid', label: 'Typhoid Ab', result: 'Not Performed' }, //Typhoid Antibody
    { id: 'tb', label: 'TB (Tuberculosis)', result: 'Not Performed' }, //Tuberculosis
    { id: 'malaria', label: 'Malaria PF/PV Ag', result: 'Not Performed' }, //Malaria Plasmodium falciparum / Plasmodium vivax Antigen
]

const MORE_TEST_OPTIONS: Omit<MoreTest, 'value'>[] = [
    { id: 'hemoglobin', label: 'Hemoglobin', normalRange: '13.8–17.2 g/dL, Female 12.1–15.1 g/dL' },
    { id: 'cholesterol', label: 'Cholesterol', normalRange: 'Average below 200 mg/dL' },
    { id: 'bodyfat', label: 'Body Fat', normalRange: 'Male: 10–20%, Female: 18–28%' },
    // { id: 'creatinine', label: 'Creatinine', normalRange: '0.7–1.3 mg/dL (Male), 0.6–1.1 mg/dL (Female)' },
    // { id: 'uricacid', label: 'Uric Acid', normalRange: 'Male: 3.4–7.0 mg/dL, Female: 2.4–6.0 mg/dL' },
    // { id: 'platelets', label: 'Platelets', normalRange: '150,000–400,000 per µL' },
]

const DISCLAIMER = `Rapid medical screenings test are only for preliminary screening and guidance. For confirmation of any condition, please consult with a licensed medical practitioner, perform required test(s) from a certified lab, and then follow medical advice for treatment, if needed. EZShifa is performing rapid medical test as social service. The rapid tests are only for preliminary medical screening. The tests are approved by DRAP, but still have a possibility of getting few falls positive. We take adequate precautions to avoid such events.\n\nThis preventive medical screening exercise at such a mass scale is an extremely needed social service to prevent long term aliments, avoidable serious medical conditions and premature fatalities.`

// ─── Result Dropdown ─────────────────────────────────────────────────────────
const ResultDropdown = ({
    value,
    onChange,
}: {
    value: TestResult
    onChange: (v: TestResult) => void
}) => {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const colorClass =
        value === 'Normal'
            ? 'text-green-600 border-green-300 bg-green-50'
            : value === 'Consultation Required'
                ? 'text-red-500 border-red-300 bg-red-50'
                : 'text-slate-500 border-slate-200 bg-white'

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(p => !p)}
                className={`flex items-center justify-between gap-2 border rounded-xl px-3 py-2 text-xs font-semibold w-full transition-colors ${colorClass}`}
            >
                <span>{value}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-full min-w-160px">
                    {RESULT_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false) }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-slate-50 transition-colors
                ${opt === 'Normal' ? 'text-green-600' : opt === 'Consultation Required' ? 'text-red-500' : 'text-slate-600'}`}
                        >
                            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                                {value === opt && <Check className="w-3 h-3" />}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Test Card ────────────────────────────────────────────────────────────────
const TestCard = ({
    id,
    label,
    result,
    onChange,
    children,
}: {
    id: string
    label: string
    result: TestResult
    onChange: (v: TestResult) => void
    children?: React.ReactNode
}) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">{label}</p>
            <div className="p-2 rounded-xl bg-slate-100">
                {TEST_ICONS[id] ?? <Stethoscope className="w-7 h-7 text-[#0297d6]" />}
            </div>
        </div>
        {children}
        <ResultDropdown value={result} onChange={onChange} />
    </div>
)

// ─── More Tests Dialog ────────────────────────────────────────────────────────
const MoreTestsDialog = ({
    selected,
    onClose,
    onConfirm,
}: {
    selected: string[]
    onClose: () => void
    onConfirm: (ids: string[]) => void
}) => {
    const [local, setLocal] = useState<string[]>(selected)
    const toggle = (id: string) =>
        setLocal(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="px-6 pt-5 pb-3">
                    <h3 className="text-base font-bold text-slate-800">Select Tests</h3>
                </div>
                <div className="px-6 pb-2 flex flex-col gap-3">
                    {MORE_TEST_OPTIONS.map(opt => (
                        <label
                            key={opt.id}
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => toggle(opt.id)}
                        >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                ${local.includes(opt.id) ? 'bg-[#0297d6] border-[#0297d6]' : 'border-slate-300 bg-white'}`}>
                                {local.includes(opt.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-slate-700 font-medium">{opt.label}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button onClick={onClose} className="text-sm font-bold text-slate-500 hover:text-slate-700 px-3 py-1">CANCEL</button>
                    <button onClick={() => onConfirm(local)} className="text-sm font-bold text-[#0297d6] hover:text-[#0280bb] px-3 py-1">OK</button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
interface RapidTestingPageProps {
    onNext: (data: RapidTestingData) => void
    onSkip: () => void
    onBack: () => void
    sessionName?: string
    sessionPhone?: string
    sessionToken?: string
    sessionAge?: string
    sessionGender?: string
    vitalsId?: string
    prefetchedData?: any
}

const RapidTestingPage: React.FC<RapidTestingPageProps> = ({
    onNext,
    onSkip,
    onBack,
    sessionName = '',
    sessionPhone = '',
    sessionToken = '',
    sessionAge = "",
    sessionGender = "",
    vitalsId,
    prefetchedData,
}) => {
    const [bloodSugar, setBloodSugar] = useState<BloodSugar>(() => {
        if (prefetchedData?.bloodSugar && prefetchedData.bloodSugar !== 'Not Performed') {
            const match = prefetchedData.bloodSugar.match(/^([\d.]+)\s*\((\w+)\)$/)
            if (match) return { value: match[1], type: match[2] as 'Random' | 'Fasting' }
        }
        return { value: '', type: 'Random' }
    })
    const [sugarTypeOpen, setSugarTypeOpen] = useState(false)
    const [glucosePopup, setGlucosePopup] = useState({
        visible: false,
        value: null as number | null,
    })
    const [ecgPopup, setEcgPopup] = useState({
        visible: false,
        filename: '',
    })
    const [tests, setTests] = useState<TestItem[]>(() => {
        if (!prefetchedData) return DEFAULT_TESTS
        return DEFAULT_TESTS.map(t => {
            const fieldMap: Record<string, string> = {
                ecg: 'ecg',
                hiv: 'hiv',
                hepatitis: 'hepatitis',
                hbsag: 'hbsag',
                hcvab: 'hcvAb',
                hiv12ab: 'hivAb',
                dengue: 'dengueNs1Ag',
                syphilis: 'syphilisAb',
                typhoid: 'typhoidAb',
                tb: 'tuberculosis',
                malaria: 'malariaPfPvAg',
            }
            const key = fieldMap[t.id]
            const val = key ? prefetchedData[key] : null
            return val && val !== 'Not Performed' ? { ...t, result: val as TestResult } : t
        })
    })
    const [moreTests, setMoreTests] = useState<MoreTest[]>(() => {
        return MORE_TEST_OPTIONS.map(opt => {
            const keyMap: Record<string, string> = {
                hemoglobin: 'hemoglobin',
                cholesterol: 'cholesterol',
                bodyfat: 'bodyFat',
            }
            const val = prefetchedData?.[keyMap[opt.id]]
            return { ...opt, value: val || '' }
        })
    })

    const [annotatedPdfUrl, setAnnotatedPdfUrl] = useState<string | null>(null)
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
    const [isNextLoading, setIsNextLoading] = useState(false)
    const sessionDataRef = useRef({ name: sessionName, age: '', gender: '' })

    const [isUploadingEcg, setIsUploadingEcg] = useState(false)
    const [ecgCloudinaryUrl, setEcgCloudinaryUrl] = useState<string | null>(null);

    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const pdfBlobUrlRef = useRef<string | null>(null);

    const [isIframeLoading, setIsIframeLoading] = useState(false);

    useEffect(() => {
        if (!ecgCloudinaryUrl) return;

        console.log('📄 Fetching PDF from Cloudinary:', ecgCloudinaryUrl);

        let cancelled = false;

        fetch(ecgCloudinaryUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then(blob => {
                if (cancelled) return;

                // Revoke the previous blob before creating a new one
                if (pdfBlobUrlRef.current) {
                    URL.revokeObjectURL(pdfBlobUrlRef.current);
                }

                const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                const url = URL.createObjectURL(pdfBlob);

                pdfBlobUrlRef.current = url; // keep ref in sync
                setPdfBlobUrl(url);
            })
            .catch(err => console.error('❌ Failed to fetch PDF:', err));

        return () => {
            cancelled = true;
            // Only revoke on unmount or when ecgCloudinaryUrl actually changes
            if (pdfBlobUrlRef.current) {
                URL.revokeObjectURL(pdfBlobUrlRef.current);
                pdfBlobUrlRef.current = null;
            }
        };
    }, [ecgCloudinaryUrl]); // pdfBlobUrl intentionally NOT in deps

    console.log("pdfBlobUrl: " + pdfBlobUrl)

    useEffect(() => {
        sessionDataRef.current = {
            name: sessionName,
            age: sessionAge || '',
            gender: sessionGender || '',
        }
    }, [sessionName, sessionAge, sessionGender])

    useEffect(() => {
        window.onGlucoseReceived = (mgdl) => {
            console.log('Glucose received: ', mgdl)
            setBloodSugar({ value: mgdl.toString(), type: "Random" })
            setGlucosePopup({ visible: true, value: mgdl })
        }
        return () => { delete window.onGlucoseReceived }
    }, [])


    useEffect(() => {
        let currentUrl: string | null = null

            ; (window as any).receiveEcgFile = async (base64: string, filename: string) => {
                console.log('📄 Received ECG file:', filename);
                setEcgPopup({ visible: true, filename });
                setIsUploadingEcg(true);

                try {
                    // 1️⃣ Remove data URL prefix if present
                    let base64Data = base64;
                    if (base64.startsWith('data:')) {
                        const parts = base64.split(',');
                        if (parts.length === 2) {
                            base64Data = parts[1];
                            console.log('Stripped data URL prefix');
                        } else {
                            throw new Error('Invalid data URL format');
                        }
                    }

                    // 2️⃣ Clean and decode base64
                    const cleanBase64 = base64Data.replace(/\s/g, '');
                    const binaryString = atob(cleanBase64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // 3️⃣ Create File object
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    const file = new File([blob], filename, { type: 'application/pdf' });

                    console.log('📄 File size:', file.size, 'bytes');
                    console.log('📄 File type:', file.type);

                    // 4️⃣ Upload via apiService
                    const result = await apiService.uploadEcgReport(file, sessionName, sessionPhone);
                    const cloudinaryUrl = result.url;
                    setEcgCloudinaryUrl(cloudinaryUrl);
                    console.log('ECG uploaded to Cloudinary:', cloudinaryUrl);

                } catch (err) {
                    console.error('Error uploading ECG:', err);
                } finally {
                    setIsUploadingEcg(false);
                }
            };

        return () => {
            delete (window as any).receiveEcgFile
            if (currentUrl) URL.revokeObjectURL(currentUrl)
        }
    }, []) // runs once; session data is not needed for this non-annotation test

    useEffect(() => {
        const bridge = (window as any).AndroidNative
        if (bridge?.setPatientName && sessionName) {
            bridge.setPatientName(sessionName)
        }
        if (bridge?.setPatientPhone && sessionPhone) {
            bridge.setPatientPhone(sessionPhone)
        }
    }, [sessionName, sessionPhone])

    const handleCheckECG = () => {
        const bridge = window.AndroidNative
        if (bridge?.openKardiaApp) {
            bridge.openKardiaApp()
        } else {
            console.warn("Native bridge not found")
            // Optional: show a toast or alert
        }
    }

    const updateTest = (id: string, result: TestResult) =>
        setTests(prev => prev.map(t => (t.id === id ? { ...t, result } : t)))

    const handleMoreConfirm = (ids: string[]) => {
        setMoreTests(
            ids.map(id => {
                const existing = moreTests.find(m => m.id === id)
                const def = MORE_TEST_OPTIONS.find(o => o.id === id)!
                return existing ?? { ...def, value: '' }
            })
        )

    }

    const updateMoreTest = (id: string, value: string) =>
        setMoreTests(prev => prev.map(m => (m.id === id ? { ...m, value } : m)))

    const handleNext = () => onNext({
        bloodSugar,
        tests,
        moreTests,
        ecgLink: ecgCloudinaryUrl ?? 'Not Performed'
    })

    const regularTests = tests.filter(t => t.id !== 'ecg')
    const ecgTest = tests.find(t => t.id === 'ecg')!

    return (
        <div className="relative min-h-screen bg-slate-50">
            {/* Toast popup */}
            {/* Glucose Success Popup */}
            <ToastPopup
                visible={glucosePopup.visible}
                onDismiss={() => setGlucosePopup({ visible: false, value: null })}
                title="Glucose Value Added"
                value={glucosePopup.value}
                valueLabel="mg/dL"
            />

            {/* ECG Success Popup */}
            <ToastPopup
                visible={ecgPopup.visible}
                onDismiss={() => setEcgPopup({ visible: false, filename: '' })}
                title="ECG Report Added"
                message={`ECG report "${ecgPopup.filename}" downloaded successfully.`}
            />

            {/* ── Navbar ── */}
            <NavBarTestPages
                title="Rapid Testing"
                sessionName={sessionName}
                sessionPhone={sessionPhone}
                sessionToken={sessionToken}
            />

            {/* ── Scrollable Content ── */}
            <div className="p-4 md:p-6 space-y-2">

                {/* ── FIX 2: Blood Sugar + ECG in same unified grid row
            They share the same grid as the other cards so they sit
            flush in the same row on desktop instead of a separate section. */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">

                    {/* Blood Sugar */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-700">Blood Sugar</p>
                            <div className="p-2 rounded-xl bg-slate-100">
                                <Droplets className="w-7 h-7 text-[#0297d6]" />
                            </div>
                        </div>
                        {/* ── FIX 1: wider input + row that doesn't wrap ── */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={bloodSugar.value}
                                onChange={e => setBloodSugar(p => ({ ...p, value: e.target.value }))}
                                placeholder="—"
                                className="text-xl font-bold text-[#0297d6] border border-slate-200 rounded-lg px-3 py-2 w-28 focus:outline-none focus:border-[#0297d6]"
                            />
                            <div className="relative">
                                <button
                                    onClick={() => setSugarTypeOpen(p => !p)}
                                    className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-slate-600 whitespace-nowrap"
                                >
                                    {bloodSugar.type}
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                {sugarTypeOpen && (
                                    <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-110px">
                                        {(['Random', 'Fasting'] as const).map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => { setBloodSugar(p => ({ ...p, type: opt })); setSugarTypeOpen(false) }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Random: 80–180 mg/dL / Fasting: 80–120 mg/dL
                        </p>
                    </div>

                    {/* ECG Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-700">ECG</p>
                            <div className="p-2 rounded-xl bg-slate-100">
                                <Activity className="w-7 h-7 text-[#0297d6]" />
                            </div>
                        </div>

                        {/* Primary action: always visible */}
                        <button
                            onClick={handleCheckECG}
                            className="bg-[#0297d6] text-white text-sm font-bold rounded-lg py-2 px-3 hover:bg-[#0280bb] transition-colors flex items-center justify-center gap-2"
                        >
                            <Activity className="w-4 h-4" />
                            Check ECG
                        </button>

                        {/* Secondary action: only visible when a report exists */}
                        {ecgCloudinaryUrl && (
                            <div className="text-center -mt-1">
                                <button
                                    onClick={() => setIsPdfModalOpen(true)}
                                    className="text-xs text-green-500 font-medium flex items-center justify-center gap-1 hover:underline cursor-pointer"
                                >
                                    <FileText className="w-3 h-3" />
                                    View ECG Report
                                </button>
                            </div>
                        )}

                        <ResultDropdown value={ecgTest.result} onChange={v => updateTest('ecg', v)} />
                    </div>

                    {/* All regular tests in same grid row */}
                    {regularTests.map(test => (
                        <TestCard
                            key={test.id}
                            id={test.id}
                            label={test.label}
                            result={test.result}
                            onChange={v => updateTest(test.id, v)}
                        />
                    ))}

                    {/* More Tests as regular cards */}
                    {moreTests.map(test => (
                        <div key={test.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-700">{test.label}</p>
                                <div className="p-2 rounded-xl bg-slate-100">
                                    {MORE_ICONS[test.id]}
                                </div>
                            </div>
                            <p className="p-0 m-0 text-[10px] text-slate-400 font-medium">{test.normalRange}</p>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={test.value}
                                onChange={e => updateMoreTest(test.id, e.target.value)}
                                placeholder="—"
                                className="text-xl font-bold text-[#0297d6] border border-slate-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#0297d6]"
                            />
                        </div>
                    ))}
                </div>

                {/* Disclaimer */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        <span className="font-bold text-slate-800">Disclaimer: </span>
                        {DISCLAIMER}
                    </p>
                </div>
            </div>

            {/* Inline buttons — scroll with page just like vitals Next button */}
            <div className="flex justify-between items-center px-4 md:px-6 py-6">
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={async () => { setIsNextLoading(true); await handleNext(); setIsNextLoading(false); }}
                    disabled={isNextLoading}
                    className="px-8 py-2.5 text-base font-bold bg-[#0297d6] hover:bg-[#0280bb] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                    {isNextLoading ? (
                        <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Saving...
                        </>
                    ) : 'Next →'}
                </button>
            </div>

            {/* PDF Modal */}
            {isPdfModalOpen && ecgCloudinaryUrl && (
                <div className="fixed inset-0 md:inset-y-0 md:left-16 md:right-0 z-50 bg-black/75 p-4 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h3 className="text-lg font-semibold">ECG Report</h3>
                            <button
                                onClick={() => { setIsPdfModalOpen(false); setIsIframeLoading(false); }}
                                className="text-slate-500 hover:text-slate-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 relative">
                            {isIframeLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3">
                                    <svg className="animate-spin w-8 h-8 text-[#0297d6]" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    <p className="text-sm text-slate-500 font-medium">Loading ECG Report…</p>
                                </div>
                            )}
                            <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(ecgCloudinaryUrl!)}&embedded=true`}
                                className="w-full h-full"
                                title="ECG Report"
                                onLoad={() => setIsIframeLoading(false)}
                            />
                        </div>
                        <div className="text-center p-2 border-t">
                            <a
                                href={ecgCloudinaryUrl}
                                download="ecg_report.pdf"
                                className="text-xs text-[#0297d6] hover:underline"
                            >
                                Download PDF
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RapidTestingPage