'use client'
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ColorBlindTestData {
    plate1: string;
    plate2: string;
    plate3: string;
    colorBlindResult: "Passed" | "Failed" | "Not Performed";
    skipped: boolean;
}

interface ColorBlindTestPageProps {
    onNext: (data: ColorBlindTestData) => void
    onSkip: () => void
    onBack: () => void
    sessionName?: string
    sessionPhone?: string
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
}) => {

    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})

    const current = PLATES[currentIndex]
    const selected = answers[currentIndex] ?? ''
    const isLastPlate = currentIndex === PLATES.length - 1
    const isFirstPlate = currentIndex === 0

    const handleSelect = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: value }))
    }

    const handleNext = () => {
        if (isLastPlate) {
            const plate1 = answers[0] ?? ''
            const plate2 = answers[1] ?? ''
            const plate3 = answers[2] ?? ''

            const correctCount = [
                plate1 === PLATES[0].correct,
                plate2 === PLATES[1].correct,
                plate3 === PLATES[2].correct
            ].filter(Boolean).length

            const colorBlindResult = correctCount >= 2 ? "Passed" : "Failed"

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

            {/* ── Navbar ── */}
            <nav className="w-full bg-[#0297d6] text-white px-4 py-4 shadow-md shrink-0 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-bold tracking-tight whitespace-nowrap">EZShifa</span>
                            <span className="opacity-40 text-lg shrink-0">|</span>
                            <span className="text-lg font-semibold whitespace-nowrap">Digital Health Clinic</span>
                        </div>
                        <p className="text-sm font-bold text-white mt-0.5 leading-none">Hearing Test</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {(sessionName || sessionPhone) && (
                            <div className="flex flex-col items-end gap-0.5">
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
                        {isFirstPlate && (
                            <button
                                onClick={handleSkip}
                                className="bg-white text-[#0297d6] font-bold px-6 py-2 mt-1 mr-1 rounded-full hover:text-[#000000] transition-colors shadow-md"
                            >
                                Skip
                            </button>
                        )}
                    </div>
                </div>
            </nav>

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
                        disabled={!selected}
                        className={`px-8 py-2.5 text-base font-bold rounded-lg transition-colors
                            ${selected
                                ? 'bg-[#0297d6] hover:bg-[#0280bb] text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {isLastPlate ? 'Finish' : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ColorBlindTestPage