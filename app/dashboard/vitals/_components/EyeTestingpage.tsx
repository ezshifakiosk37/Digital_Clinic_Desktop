//EyeTestingpage.tsx
'use client'
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import NavBarTestPages from './NavBarTestPages'
// ─── Types ───────────────────────────────────────────────────────────────────
type ChartType = 'English' | 'Urdu' | 'Shapes' | 'Mix'

export interface EyeTestingData {
    chartType: ChartType
    leftEye: string
    rightEye: string
    skipped: boolean
}

// ─── Snellen Chart Data ───────────────────────────────────────────────────────
const ENGLISH_ROWS = [
    { vision: '20/200', letters: ['E'] },
    { vision: '20/100', letters: ['F', 'P'] },
    { vision: '20/70', letters: ['T', 'O', 'Z'] },
    { vision: '20/50', letters: ['L', 'P', 'E', 'D'] },
    { vision: '20/40', letters: ['P', 'E', 'C', 'F', 'D'] },
    { vision: '20/30', letters: ['E', 'D', 'F', 'C', 'Z', 'P'] },
    { vision: '20/25', letters: ['F', 'E', 'L', 'O', 'P', 'Z', 'D'] },
    { vision: '20/20', letters: ['D', 'E', 'F', 'P', 'O', 'T', 'E', 'C'] },
]

const URDU_ROWS = [
    { vision: '20/200', letters: ['ا'] },
    { vision: '20/100', letters: ['ب', 'پ'] },
    { vision: '20/70', letters: ['ت', 'ٹ', 'ث'] },
    { vision: '20/50', letters: ['ج', 'چ', 'ح', 'خ'] },
    { vision: '20/40', letters: ['د', 'ڈ', 'ذ', 'ر', 'ز'] },
    { vision: '20/30', letters: ['ژ', 'س', 'ش', 'ص', 'ض', 'ط'] },
    { vision: '20/25', letters: ['ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ'] },
    { vision: '20/20', letters: ['ل', 'م', 'ن', 'و', 'ہ', 'ی', 'ے', 'ء'] },
]

const SHAPES_ROWS = [
    { vision: '20/200', letters: ['🏠'] },
    { vision: '20/100', letters: ['🌲', '🐦'] },
    { vision: '20/70', letters: ['🚗', '⭐', '❤️'] },
    { vision: '20/50', letters: ['🌙', '☀️', '⚡', '🔴'] },
    { vision: '20/40', letters: ['🔵', '🟢', '🟡', '🔶', '🏠'] },
    { vision: '20/30', letters: ['🌲', '🐦', '🚗', '⭐', '❤️', '🌙'] },
    { vision: '20/25', letters: ['☀️', '⚡', '🔴', '🔵', '🟢', '🟡', '🔶'] },
    { vision: '20/20', letters: ['🏠', '🌲', '🐦', '🚗', '⭐', '❤️', '🌙', '☀️'] },
]

const MIX_ROWS = [
    { vision: '20/200', letters: ['E'] },
    { vision: '20/100', letters: ['ب', 'P'] },
    { vision: '20/70', letters: ['T', 'ظ', 'Z'] },
    { vision: '20/50', letters: ['L', 'پ', 'E', 'D'] },
    { vision: '20/40', letters: ['P', 'ع', 'C', 'ف', 'D'] },
    { vision: '20/30', letters: ['E', 'D', 'ش', 'C', 'Z', 'P'] },
    { vision: '20/25', letters: ['F', 'ک', 'L', 'O', 'گ', 'Z', 'D'] },
    { vision: '20/20', letters: ['D', 'ے', 'F', 'P', 'O', 'ط', 'E', 'C'] },
]

const CHART_ROWS: Record<ChartType, typeof ENGLISH_ROWS> = {
    English: ENGLISH_ROWS,
    Urdu: URDU_ROWS,
    Shapes: SHAPES_ROWS,
    Mix: MIX_ROWS,
}

const FONT_SIZES = [
    'text-[88px]', 'text-[72px]', 'text-[60px]', 'text-[48px]',
    'text-[40px]', 'text-[32px]', 'text-[26px]', 'text-[22px]',
]

// ─── Info Dialog ──────────────────────────────────────────────────────────
const InfoDialog = ({ message, onOk }: { message: string; onOk: () => void }) => (
    <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0297d6] flex items-center justify-center text-white font-bold text-xl">i</div>
            <p className="text-base font-bold text-slate-800 text-center">{message}</p>
            <button onClick={onOk} className="w-full bg-[#0297d6] text-white font-bold py-3 rounded-xl hover:bg-[#0280bb]">
                OK
            </button>
        </div>
    </div>
)

// ─── Chart Test Screen (Now Full Screen) ─────────────────────────────────────
const ChartTest = ({
    chartType,
    eye,
    onDone,
    setStage,
}: {
    chartType: ChartType
    eye: 'left' | 'right'
    onDone: (result: string) => void
    setStage: React.Dispatch<React.SetStateAction<any>>
}) => {
    const rows = CHART_ROWS[chartType]
    const [rowIndex, setRowIndex] = useState(0)
    const [canRead, setCanRead] = useState(false)

    const currentRow = rows[rowIndex]
    const isUrdu = chartType === 'Urdu'
    const isLastRow = rowIndex === rows.length - 1

    const handleNext = () => {
        if (canRead) {
            onDone(currentRow.vision)
        } else if (isLastRow) {
            onDone(currentRow.vision)
        } else {
            setRowIndex(p => p + 1)
            setCanRead(false)
        }
    }

    const resultLabel = canRead || isLastRow ? currentRow.vision : ''
    const showNext = canRead || isLastRow

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden md:ml-16">
            {/* Navbar — identical to select stage navbar */}
            <nav className="w-full bg-[#0297d6] text-white px-4 py-4 shadow-md shrink-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-2xl font-bold tracking-tight">EZShifa</span>
                                <span className="opacity-40 text-lg">|</span>
                                <span className="text-lg font-semibold">Digital Health Clinic</span>
                            </div>
                            <p className="text-sm font-bold text-white mt-0.5">Eye Examination</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStage('select')}
                        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </nav>
            {/* Sub-header */}
            <div className="flex items-center px-5 pt-3 pb-2 shrink-0 bg-slate-50 border-b border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Identify the Letter / Shape in the blue box</p>
            </div>
            {/* Toggle */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50">
                <span className="text-sm font-black text-slate-800 uppercase tracking-wide">CAN YOU READ IT?</span>
                <button
                    onClick={() => setCanRead(p => !p)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${canRead ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${canRead ? 'left-7' : 'left-0.5'}`} />
                    <span className={`absolute inset-0 flex items-center text-[10px] font-black ${canRead ? 'justify-start pl-1.5 text-white' : 'justify-end pr-1.5 text-slate-500'}`}>
                        NO
                    </span>
                </button>
            </div>

            {/* Main Test Area */}
            <div className="flex-1 flex items-center justify-center relative px-8 bg-white">
                <button
                    onClick={() => setRowIndex(p => Math.max(0, p - 1))}
                    className="absolute left-6 text-slate-400 hover:text-slate-600 z-10"
                >
                    <ArrowLeft className="w-10 h-10" />
                </button>

                <div
                    className={`flex items-center justify-center gap-6 flex-wrap ${FONT_SIZES[rowIndex]} font-bold text-slate-900 leading-none select-none ${isUrdu ? 'font-["Noto_Naskh_Arabic"]' : ''}`}
                    style={isUrdu ? { fontFamily: 'serif', direction: 'rtl' } : {}}
                >
                    {currentRow.letters.map((letter, i) => (
                        <span key={i}>{letter}</span>
                    ))}
                </div>

                <button
                    onClick={() => setRowIndex(p => Math.min(rows.length - 1, p + 1))}
                    className="absolute right-6 text-slate-400 hover:text-slate-600 z-10"
                >
                    <ArrowRight className="w-10 h-10" />
                </button>
            </div>

            {/* Next Button */}
            {showNext && (
                <div className="flex justify-end px-5 py-4 bg-white">
                    <button
                        onClick={handleNext}
                        className="bg-[#0297d6] text-white font-bold px-10 py-3 rounded-full shadow-lg hover:bg-[#0280bb] transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Bottom Status */}
            <div className="border-t border-slate-100 px-5 py-4 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
                    {resultLabel ? 'Eyesight Results' : `Testing ${eye === 'left' ? 'Left' : 'Right'} Eye`}
                </p>
                <div className="flex justify-center gap-8">
                    {eye === 'left' ? (
                        <div className="flex flex-col items-center gap-1">
                            <div className={`px-6 py-2 rounded-lg text-sm font-bold ${resultLabel ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
                                {resultLabel || 'Left eye value'}
                            </div>
                            <span className="text-xs text-slate-500">Left Eye</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center gap-1 opacity-50">
                                <div className="px-6 py-2 rounded-lg text-sm font-bold bg-slate-300 text-slate-700">Already done</div>
                                <span className="text-xs text-slate-500">Left Eye</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className={`px-6 py-2 rounded-lg text-sm font-bold ${resultLabel ? 'bg-slate-300 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
                                    {resultLabel || 'Right eye value'}
                                </div>
                                <span className="text-xs text-slate-500">Right Eye</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
interface EyeTestingPageProps {
    onNext: (data: EyeTestingData) => void
    onSkip: () => void
    onSkipToColorBlind: () => void
    sessionName?: string
    sessionPhone?: string
    sessionToken?: string
    vitalsId?: string
    prefetchedData?: any
}

type Stage = 'select' | 'info_stand' | 'info_cover_left' | 'test_right' | 'info_cover_right' | 'test_left'

const EyeTestingPage: React.FC<EyeTestingPageProps> = ({
    onNext,
    onSkip,
    onSkipToColorBlind,
    sessionName = '',
    sessionPhone = '',
    sessionToken = '',
    vitalsId,
    prefetchedData,
}) => {
    const [chartType, setChartType] = useState<ChartType>('English')
    const [stage, setStage] = useState<Stage>('select')
    const [leftEyeResult, setLeftEyeResult] = useState('')
    const [rightEyeResult, setRightEyeResult] = useState('')

    const [showPrefetchDialog, setShowPrefetchDialog] = useState(
        !!(prefetchedData && prefetchedData.leftEye && prefetchedData.leftEye !== 'Not Performed')
    )
    const [isLoading, setIsLoading] = useState(false);
    const handleTypeSelect = (type: ChartType) => setChartType(type)
    const handleBegin = () => {
        setIsLoading(true);
        setStage('info_stand');
    };

    const handleLeftDone = (result: string) => {
        setLeftEyeResult(result)
        setStage('info_cover_right')
    }

    const handleRightDone = (result: string) => {
        setRightEyeResult(result)
        onNext({ chartType, leftEye: leftEyeResult, rightEye: result, skipped: false })
    }

    const CHART_OPTIONS = [
        { type: 'English' as const, label: 'English', content: <span className="text-5xl font-black text-white">E<sub className="text-2xl">A</sub>X</span> },
        { type: 'Urdu' as const, label: 'Urdu', content: <span className="text-5xl font-bold" style={{ fontFamily: 'serif' }}>ظ<sub className="text-2xl">ط</sub>ش</span> },
        { type: 'Shapes' as const, label: 'Shapes', content: <div className="text-4xl">🏠🌲<br />🐦</div> },
        { type: 'Mix' as const, label: 'Mix', content: <div className="text-4xl">🚗 E<br />ش</div> },
    ]

    return (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-hidden md:ml-16">

            {/* ── Previous Result Dialog ── */}
            {showPrefetchDialog && prefetchedData && (
                <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-[#0297d6] flex items-center justify-center text-white text-2xl">👁</div>
                        <h2 className="text-lg font-black text-slate-800 text-center">Previous Eye Test Result</h2>
                        <div className="w-full bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Chart Type</span>
                                <span className="font-bold text-slate-800">{prefetchedData.chartType ?? '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Left Eye</span>
                                <span className="font-bold text-[#0297d6]">{prefetchedData.leftEye ?? '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Right Eye</span>
                                <span className="font-bold text-[#0297d6]">{prefetchedData.rightEye ?? '—'}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowPrefetchDialog(false)}
                                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                            >
                                Perform Again
                            </button>
                            <button
                                onClick={() => onSkipToColorBlind()}
                                className="flex-1 py-3 rounded-xl bg-[#0297d6] text-white font-bold text-sm hover:bg-[#0280bb]"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Navbar ── */}
            <NavBarTestPages
                title="Eye Screening"
                sessionName={sessionName}
                sessionPhone={sessionPhone}
                sessionToken={sessionToken}
                rightSlot={
                    <button
                        onClick={onSkipToColorBlind}
                        className="bg-white text-[#0297d6] font-bold px-6 py-2 rounded-full"
                    >
                        Skip
                    </button>
                }
            />
            {/* Select Stage - 2x2 Grid (Fixed button visibility) */}
            {stage === 'select' && (
                <div className="flex flex-col h-[calc(100vh-73px)] px-6">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="grid grid-cols-4 gap-4 max-w-full">
                            {CHART_OPTIONS.map(opt => (
                                <button
                                    key={opt.type}
                                    onClick={() => handleTypeSelect(opt.type)}
                                    className={`h-52 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 border-2 transition-all ${chartType === opt.type ? 'bg-[#0297d6] border-[#0297d6] text-white shadow-lg' : 'bg-white border-slate-200 hover:shadow'}`}
                                >
                                    <div className="text-5xl">{opt.content}</div>
                                    <span className="text-lg font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pb-6 pt-2">
                        <button
                            onClick={onSkip}
                            className="px-8 py-3 border border-slate-200 rounded-xl font-medium"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleBegin}
                            disabled={isLoading}
                            className={`px-10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
        ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0297d6] hover:bg-[#0280bb] text-white'}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                </>
                            ) : (
                                'Next →'
                            )}
                        </button>
                    </div>
                </div>
            )}
            {/* Info & Test Screens */}
            {stage === 'info_stand' && <InfoDialog message="Stand at mark line for eye examination." onOk={() => setStage('info_cover_left')} />}
            {stage === 'info_cover_left' && <InfoDialog message="Cover your LEFT EYE while examination" onOk={() => setStage('test_left')} />}
            {stage === 'info_cover_right' && <InfoDialog message="Cover your RIGHT EYE while examination" onOk={() => setStage('test_right')} />}

            {stage === 'test_left' && <ChartTest chartType={chartType} eye="left" onDone={handleLeftDone} setStage={setStage} />}
            {stage === 'test_right' && <ChartTest chartType={chartType} eye="right" onDone={handleRightDone} setStage={setStage} />}
        </div>
    )
}

export default EyeTestingPage

