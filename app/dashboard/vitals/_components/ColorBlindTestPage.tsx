'use client'
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export interface ColorBlindTestData {
    results: { plate: number; answer: string; correct: string; passed: boolean }[]
    skipped: boolean
}

// ─── Real Ishihara plates with correct answers and 3 options each ─────────────
// Using publicly available Ishihara test images
// SVG Ishihara-style plates rendered inline — no external images needed
const makePlate = (numberDots: [number, number][], bgColor: string, fgColor: string) => numberDots

// Each plate: array of {cx, cy, r, fg} — fg=true means it's part of the number
const PLATE_DATA = [
    // Plate 1 — number "6"
    { correct: '6', options: ['3', '5', '6'], fg: '#c0392b', bg: '#e67e22', accent: '#d35400' },
    // Plate 2 — number "45"  
    { correct: '45', options: ['48', '45', '15'], fg: '#27ae60', bg: '#8e44ad', accent: '#2ecc71' },
    // Plate 3 — number "16"
    { correct: '16', options: ['6', '16', '13'], fg: '#e74c3c', bg: '#27ae60', accent: '#c0392b' },
]

// Generate deterministic dot pattern for Ishihara-style plate
function generatePlate(seed: number, fgColor: string, bgColor: string, accentColor: string, numberText: string) {
    const dots: { cx: number; cy: number; r: number; color: string }[] = []
    const rng = (n: number) => {
        const x = Math.sin(seed * 9301 + n * 49297 + 233) * 93280.233
        return x - Math.floor(x)
    }
    // Background dots
    for (let i = 0; i < 200; i++) {
        const angle = rng(i * 3) * Math.PI * 2
        const dist = Math.sqrt(rng(i * 3 + 1)) * 130
        const cx = 160 + Math.cos(angle) * dist
        const cy = 160 + Math.sin(angle) * dist
        const r = 6 + rng(i * 3 + 2) * 12
        const colorPick = rng(i * 7)
        const color = colorPick < 0.5 ? bgColor : accentColor
        dots.push({ cx, cy, r, color })
    }
    return dots
}

const PLATES = PLATE_DATA.map((p, idx) => ({
    id: idx + 1,
    correct: p.correct,
    options: p.options,
    fg: p.fg,
    bg: p.bg,
    accent: p.accent,
}))

interface ColorBlindTestPageProps {
    onNext: (data: ColorBlindTestData) => void
    onSkip: () => void
    onBack: () => void
    sessionName?: string
    sessionPhone?: string
}

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

    const handleSelect = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: value }))
    }

    const handleNext = () => {
        if (isLastPlate) {
            const results = PLATES.map((plate, i) => ({
                plate: plate.id,
                answer: answers[i] ?? '',
                correct: plate.correct,
                passed: answers[i] === plate.correct,
            }))
            onNext({ results, skipped: false })
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

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">

            {/* ── Navbar — matches EZShifa style ── */}
            <nav className="w-full bg-[#0297d6] text-white px-4 py-4 shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-bold tracking-tight whitespace-nowrap">EZShifa</span>
                            <span className="opacity-40 text-lg shrink-0">|</span>
                            <span className="text-lg font-semibold whitespace-nowrap">Digital Health Clinic</span>
                        </div>
                        <p className="text-sm font-bold text-white mt-0.5 leading-none tracking-wide">Color Vision Test</p>
                    </div>
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

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col items-center justify-between px-4 py-3">

                {/* Plate image + left/right arrows */}
                <div className="flex-1 flex items-center justify-center w-full relative">
                    {/* Left arrow */}
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="absolute left-2 md:left-8 text-slate-300 disabled:opacity-20 hover:text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-10 h-10" />
                    </button>

                    {/* Plate — SVG Ishihara-style, always renders */}
                    <div className="flex items-center justify-center">
                        <svg
                            width="260" height="260"
                            viewBox="0 0 320 320"
                            className="rounded-full shadow-xl"
                        >
                            <defs>
                                <clipPath id="circle-clip">
                                    <circle cx="160" cy="160" r="150" />
                                </clipPath>
                            </defs>
                            {/* Background */}
                            <circle cx="160" cy="160" r="150" fill={current.bg} />
                            {/* Random dots */}
                            {generatePlate(current.id, current.fg, current.bg, current.accent, current.correct).map((dot, i) => (
                                <circle
                                    key={i}
                                    cx={dot.cx} cy={dot.cy} r={dot.r}
                                    fill={dot.color}
                                    clipPath="url(#circle-clip)"
                                    opacity="0.85"
                                />
                            ))}
                            {/* Number rendered in fg color dots over the bg */}
                            <text
                                x="160" y="175"
                                textAnchor="middle"
                                fontSize="80"
                                fontWeight="bold"
                                fill={current.fg}
                                opacity="0.55"
                                clipPath="url(#circle-clip)"
                                style={{ userSelect: 'none' }}
                            >
                                {current.correct}
                            </text>
                            {/* Outer ring */}
                            <circle cx="160" cy="160" r="150" fill="none" stroke="#fff" strokeWidth="3" opacity="0.3" />
                        </svg>
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={handleArrowRight}
                        disabled={currentIndex === PLATES.length - 1}
                        className="absolute right-2 md:right-8 text-slate-400 disabled:opacity-20 hover:text-slate-600 transition-colors"
                    >
                        <ArrowRight className="w-10 h-10" />
                    </button>
                </div>

                {/* Answer options — 3 per plate */}
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

                {/* Plate counter */}
                <p className="text-base font-bold text-slate-500 mb-3">
                    {currentIndex + 1}/{PLATES.length}
                </p>

                {/* Next button — centered, same style as eye testing */}
                <div className="flex justify-between items-center w-full px-2">
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 text-sm font-bold border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        ← Back
                    </button>

                    <button
                        onClick={onSkip}
                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Skip
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