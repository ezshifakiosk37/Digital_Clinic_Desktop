'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
    ChevronDown, Check, ArrowLeft, ArrowRight,
    Activity, Droplets, Shield, Microscope, Bug,
    Zap, Wind, Stethoscope, FlaskConical, TestTube, Heart
} from 'lucide-react'
import ToastPopup from './ToastPopup'

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
    hemoglobin: <Droplets className="w-5 h-5 text-[#0297d6]" />,
    cholesterol: <Heart className="w-5 h-5 text-[#0297d6]" />,
    bodyfat: <Activity className="w-5 h-5 text-[#0297d6]" />,
    // creatinine: <FlaskConical className="w-5 h-5 text-[#0297d6]" />,
    // uricacid: <TestTube className="w-5 h-5 text-[#0297d6]" />,
    // platelets: <Microscope className="w-5 h-5 text-[#0297d6]" />,
}

const DEFAULT_TESTS: TestItem[] = [
    { id: 'ecg', label: 'ECG', result: 'Not Performed' },
    { id: 'hiv', label: 'HIV', result: 'Not Performed' },
    { id: 'hepatitis', label: 'Hepatitis', result: 'Not Performed' },
    { id: 'hbsag', label: 'HBsAg', result: 'Not Performed' },
    { id: 'hcvab', label: 'HCV Ab', result: 'Not Performed' },
    { id: 'hiv12ab', label: 'HIV ½ Ab', result: 'Not Performed' },
    { id: 'dengue', label: 'Dengue NS1 Ag', result: 'Not Performed' },
    { id: 'syphilis', label: 'Syphilis Ab', result: 'Not Performed' },
    { id: 'typhoid', label: 'Typhoid Ab', result: 'Not Performed' },
    { id: 'tb', label: 'TB (Tuberculosis)', result: 'Not Performed' },
    { id: 'malaria', label: 'Malaria PF/PV Ag', result: 'Not Performed' },
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
    sessionName?: string
    sessionPhone?: string
    vitalsId?: string
    prefetchedData?: any
}

const RapidTestingPage: React.FC<RapidTestingPageProps> = ({
    onNext,
    onSkip,
    sessionName = '',
    sessionPhone = '',
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
        if (!prefetchedData) return []
        const result: MoreTest[] = []
        const moreMap = [
            { id: 'hemoglobin', key: 'hemoglobin' },
            { id: 'cholesterol', key: 'cholesterol' },
            { id: 'bodyfat', key: 'bodyFat' },
        ]
        for (const { id, key } of moreMap) {
            const val = prefetchedData[key]
            if (val) {
                const def = MORE_TEST_OPTIONS.find(o => o.id === id)!
                result.push({ ...def, value: val })
            }
        }
        return result
    })
    // const [showGlucosePopup, setShowGlucosePopup] = useState(false)
    // const [lastGlucoseValue, setLastGlucoseValue] = useState<number | null>(null)
    const [showMoreDialog, setShowMoreDialog] = useState(false)

    useEffect(() => {
        window.onGlucoseReceived = (mgdl) => {
            console.log('Glucose received: ', mgdl);
            setBloodSugar({ value: mgdl.toString(), type: "Random" })
            setGlucosePopup({ visible: true, value: mgdl })
        };
        return () => { delete window.onGlucoseReceived; };
    }, []);

    // ECG file detection from Android
    useEffect(() => {
        window.onEcgFileDetected = (filename) => {
            console.log('ECG file detected: ', filename);
            setEcgPopup({ visible: true, filename })
        };
        return () => { delete window.onEcgFileDetected; };
    }, []);

    const handleCheckECG = () => {
        const bridge = window.AndroidNative;
        if (bridge?.openKardiaApp) {
            bridge.openKardiaApp();
        } else {
            console.warn("Native bridge not found");
            // Optional: show a toast or alert
        }
    };

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
        setShowMoreDialog(false)
    }

    const updateMoreTest = (id: string, value: string) =>
        setMoreTests(prev => prev.map(m => (m.id === id ? { ...m, value } : m)))

    const handleNext = () => onNext({ bloodSugar, tests, moreTests })

    const regularTests = tests.filter(t => t.id !== 'ecg')
    const ecgTest = tests.find(t => t.id === 'ecg')!

    return (
        <div className="min-h-screen bg-slate-50">
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

            {/* ── Navbar — matches existing Navbar component style exactly ── */}
            <nav className="w-full bg-[#0297d6] text-white px-4 py-4 shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    {/* Left: EZShifa branding */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-2xl font-bold tracking-tight whitespace-nowrap">EZShifa</span>
                                <span className="opacity-40 text-lg shrink-0">|</span>
                                <span className="text-lg font-semibold whitespace-nowrap">Digital Health Clinic</span>
                            </div>
                            <p className="text-sm font-bold text-white mt-0.5 leading-none tracking-wide">Rapid Testing</p>
                        </div>
                    </div>
                    {/* Right: patient session info */}
                    {(sessionName || sessionPhone) && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                            {sessionName && (
                                <span className="text-white text-xs font-medium">
                                    <span className="text-white/60 uppercase tracking-wider text-[10px] mr-1">NAME</span>
                                    <span className="font-bold">{sessionName}</span>
                                </span>
                            )}
                            {sessionPhone && (
                                <span className="text-white text-xs font-medium">
                                    <span className="text-white/60 uppercase tracking-wider text-[10px] mr-1">PHONE</span>
                                    <span className="font-bold">{sessionPhone}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </nav>

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
                            Random: 80–180 / Fasting: 80–120
                        </p>
                    </div>

                    {/* ECG */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-700">ECG</p>
                            <div className="p-2 rounded-xl bg-slate-100">
                                <Activity className="w-7 h-7 text-[#0297d6]" />
                            </div>
                        </div>
                        <button onClick={handleCheckECG} className="bg-[#0297d6] text-white text-sm font-bold rounded-lg py-2 px-3 hover:bg-[#0280bb] transition-colors flex items-center justify-center gap-2">
                            <Activity className="w-4 h-4" />
                            Check ECG
                        </button>
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
                </div>

                {/* More Tests */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowMoreDialog(true)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-[#0297d6]" />
                            {moreTests.length > 0 ? `More Tests (${moreTests.length} selected)` : 'More Tests'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-[#0297d6]" />
                    </button>

                    {moreTests.length > 0 && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-slate-100 pt-3">
                            {moreTests.map(test => (
                                <div key={test.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        {MORE_ICONS[test.id]}
                                        <p className="text-sm font-bold text-slate-700">{test.label}</p>
                                    </div>
                                    <input
                                        type="text"
                                        value={test.value}
                                        onChange={e => updateMoreTest(test.id, e.target.value)}
                                        placeholder="enter value"
                                        className="text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0297d6] bg-white text-center text-slate-600"
                                    />
                                    <p className="text-[10px] text-slate-400">{test.normalRange}</p>
                                </div>
                            ))}
                        </div>
                    )}
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
                    onClick={onSkip}
                    className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-2.5 text-base font-bold bg-[#0297d6] hover:bg-[#0280bb] text-white rounded-lg transition-colors"
                >
                    Next →
                </button>
            </div>
            {/* More Tests Dialog */}
            {showMoreDialog && (
                <MoreTestsDialog
                    selected={moreTests.map(m => m.id)}
                    onClose={() => setShowMoreDialog(false)}
                    onConfirm={handleMoreConfirm}
                />
            )}

        </div>
    )
}

export default RapidTestingPage