'use client'
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import NavBarTestPages from './NavBarTestPages'
// ─── Types ───────────────────────────────────────────────────────────────────
export interface ColorBlindTestData {
    plate1: string;
    plate2: string;
    plate3: string;
    colorBlindResult: "Normal" | "Consultation Required" | "Not Performed";
    skipped: boolean;
}

interface ColorBlindTestPageProps {
    onNext: (data: ColorBlindTestData) => void
    onSkip: () => void
    onBack: () => void
    sessionName?: string
    sessionPhone?: string
    sessionToken?: string
    vitalsId?: string
    prefetchedData?: any
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PLATES = [
    { id: 1, correct: '74', options: ['34', '45', '74'], image: '/img1.png' },
    { id: 2, correct: '45', options: ['48', '45', '15'], image: '/img2.png' },
    { id: 3, correct: '3', options: ['8', '3', '5'], image: '/img3.png' },
]

// ─── Main Component ──────────────────────────────────────────────────────────
const ColorBlindTestPage: React.FC<ColorBlindTestPageProps> = ({
    onNext,
    onSkip,
    onBack,
    sessionName = '',
    sessionPhone = '',
    sessionToken = '',
    vitalsId,
    prefetchedData,
}) => {

    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [showPrefetchDialog, setShowPrefetchDialog] = useState(
        !!(prefetchedData && prefetchedData.colorBlindResult && prefetchedData.colorBlindResult !== 'Not Performed')
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const current = PLATES[currentIndex]
    const selected = answers[currentIndex] ?? ''
    const isLastPlate = currentIndex === PLATES.length - 1
    const isFirstPlate = currentIndex === 0

    const handleSelect = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: value }))
        // Auto move to next plate only if not the last plate
        if (currentIndex !== PLATES.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handleNext = () => {
        if (isLastPlate) {
            setIsSubmitting(true)
            const plate1 = answers[0] ?? ''
            const plate2 = answers[1] ?? ''
            const plate3 = answers[2] ?? ''

            const correctCount = [
                plate1 === PLATES[0].correct,
                plate2 === PLATES[1].correct,
                plate3 === PLATES[2].correct
            ].filter(Boolean).length

            const colorBlindResult = correctCount >= 2 ? "Normal" : "Consultation Required"

            onNext({
                plate1,
                plate2,
                plate3,
                colorBlindResult,
                skipped: false
            })
        } else {
            setCurrentIndex(p => p + 1)
        }
    }

    const handlePrev = () => {
        setCurrentIndex(p => Math.max(0, p - 1))
    }

    const handleArrowRight = () => {
        if (currentIndex < PLATES.length - 1) setCurrentIndex(p => p + 1)
    }

    const handleSkip = () => {
        onNext({
            plate1: "Not Performed",
            plate2: "Not Performed",
            plate3: "Not Performed",
            colorBlindResult: "Not Performed",
            skipped: true
        })
    }

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">

            {/* ── Previous Result Dialog ── */}
            {showPrefetchDialog && prefetchedData && (
                <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-[#0297d6] flex items-center justify-center text-white text-2xl">🎨</div>
                        <h2 className="text-lg font-black text-slate-800 text-center">Previous Color Blind Result</h2>
                        <div className="w-full bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-1">
                                <span className="text-slate-500 font-medium">Result</span>
                                <span className={`font-bold ${prefetchedData.colorBlindResult === 'Normal' ? 'text-green-500' : 'text-red-500'}`}>
                                    {prefetchedData.colorBlindResult ?? '—'}
                                </span>
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
                                onClick={() => onSkip()}
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
                title="Color Blind Screening"
                sessionName={sessionName}
                sessionPhone={sessionPhone}
                sessionToken={sessionToken}
                rightSlot={
                    isFirstPlate ? (
                        <button
                            onClick={handleSkip}
                            className="bg-white text-[#0297d6] font-bold px-6 py-2 mt-1 mr-1 rounded-full hover:text-[#000000] transition-colors shadow-md"
                        >
                            Skip
                        </button>
                    ) : undefined
                }
            />
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-between px-4 py-3">

                <div className="flex-1 flex items-center justify-center w-full relative">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="absolute left-2 md:left-8 text-slate-300 disabled:opacity-20 hover:text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-10 h-10" />
                    </button>

                    <div className="flex items-center justify-center">
                        <img
                            src={current.image}
                            alt={`Ishihara plate ${current.id}`}
                            className="rounded-full shadow-xl object-cover"
                            style={{ width: 260, height: 260 }}
                        />
                    </div>

                    <button
                        onClick={handleArrowRight}
                        disabled={currentIndex === PLATES.length - 1}
                        className="absolute right-2 md:right-8 text-slate-400 disabled:opacity-20 hover:text-slate-600 transition-colors"
                    >
                        <ArrowRight className="w-10 h-10" />
                    </button>
                </div>

                <div className="flex gap-4 justify-center mb-2 mt-2">
                    {current.options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`w-20 h-20 rounded-2xl border-2 text-2xl font-bold transition-all
                                ${selected === opt
                                    ? 'bg-[#0297d6] text-white border-[#0297d6] shadow-lg'
                                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <p className="text-base font-bold text-slate-500 mb-3">
                    {currentIndex + 1}/{PLATES.length}
                </p>

                <div className="flex justify-between items-center w-full px-2">
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        ← Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!selected || isSubmitting}
                        className={`px-8 py-2.5 text-base font-bold rounded-lg transition-colors flex items-center gap-2
        ${(!selected || isSubmitting)
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-[#0297d6] hover:bg-[#0280bb] text-white'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </>
                        ) : (
                            isLastPlate ? 'Finish' : 'Next →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ColorBlindTestPage