'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import NavBarTestPages from './NavBarTestPages'
// ─── Types ────────────────────────────────────────────────────────────────────
export interface HearingTestData {
    leftEar: Record<number, number>
    rightEar: Record<number, number>
    leftResult: 'Normal' | 'Consultation Required' | 'Skipped'
    rightResult: 'Normal' | 'Consultation Required' | 'Skipped'
    skipped: boolean
}

interface HearingTestPageProps {
    onNext: (data: HearingTestData) => void
    onSkip: () => void
    onBack: () => void
    sessionName?: string
    sessionPhone?: string
    sessionToken?: string
    vitalsId?: string
    prefetchedData?: any
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000]
const DB_LEVELS = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getHearingResult(t: Record<number, number>): HearingTestData['leftResult'] {
    const v = Object.values(t)
    if (!v.length) return 'Skipped'
    const avg = v.reduce((a, b) => a + b, 0) / v.length
    if (avg <= 25) return 'Normal'
    if (avg <= 40) return 'Normal'
    if (avg <= 60) return 'Consultation Required'
    return 'Consultation Required'
}
function playDemoTone(audioCtx: AudioContext): Promise<void> {
    return new Promise(async (resolve) => {
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const duration = 4.0;          // total seconds (3–5 works well)
        const startFreq = 250;
        const endFreq = 8000;

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const panner = audioCtx.createStereoPanner();

        oscillator.type = 'sine';
        oscillator.frequency.value = startFreq;

        // Smooth exponential sweep (matches human hearing)
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);

        // Volume: ~50 dB equivalent (normalised and mapped to gain)
        const db = 50;
        const normalized = (db - 20) / (120 - 20); // = 0.3
        const gainValue = Math.pow(normalized, 2.2); // ≈ 0.07 (a bit quiet)
        // Increase slightly for demo clarity (use 0.15 to be comfortably audible)
        gainNode.gain.value = 0.15;

        panner.pan.value = 0;           // 0 = centre → both ears

        oscillator.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(audioCtx.destination);

        oscillator.start();
        // Fade out slightly at end to avoid click
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        oscillator.stop(audioCtx.currentTime + duration);

        setTimeout(() => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
                panner.disconnect();
            } catch (_) {}
            resolve();
        }, duration * 1000);
    });
}
// Mirrors Android TuneThread: samples[i] = (short)(amp * Math.sin(ph))
// Returns stopTune() — call on YES/NO just like Android isRunning=false
function startTone(
    audioCtx: AudioContext,
    hz: number,
    db: number,
    ear: 'left' | 'right'
): () => void {
    const normalized = (db - 20) / (120 - 20)
    const gain = Math.pow(normalized, 2.2)

    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    const panner = audioCtx.createStereoPanner()

    panner.pan.value = ear === 'left' ? -1 : 1
    gainNode.gain.value = Math.max(0.001, Math.min(0.98, gain))
    oscillator.type = 'sine'
    oscillator.frequency.value = hz

    oscillator.connect(gainNode)
    gainNode.connect(panner)
    panner.connect(audioCtx.destination)
    oscillator.start()

    return () => {
        try { oscillator.stop() } catch (_) { }
        try { oscillator.disconnect() } catch (_) { }
        try { gainNode.disconnect() } catch (_) { }
        try { panner.disconnect() } catch (_) { }
    }
}

// ─── Waveform bars ────────────────────────────────────────────────────────────
const HEIGHTS = Array.from({ length: 40 }, (_, i) =>
    14 + Math.abs(Math.sin(i * 0.45) * 16 + Math.cos(i * 0.3) * 8)
)

const WaveformBars = ({ playing }: { playing: boolean }) => (
    <div className="flex items-end justify-center gap-0.5 h-12 md:h-16 w-full px-2">
        {HEIGHTS.map((h, i) => (
            <div
                key={i}
                className="flex-1 max-w-2.5 rounded-t-sm"
                style={{
                    height: `${h}px`,
                    backgroundColor: '#0297d6',
                    opacity: playing ? 0.9 : 0.4,
                    animation: playing
                        ? `waveAnim ${(0.25 + (i % 6) * 0.07).toFixed(2)}s ease-in-out infinite alternate`
                        : 'none',
                }}
            />
        ))}
        <style>{`
            @keyframes waveAnim {
                from { transform: scaleY(0.4); }
                to   { transform: scaleY(1.5); }
            }
        `}</style>
    </div>
)

// ─── Frequency knob ───────────────────────────────────────────────────────────
const FreqKnob = ({ hz, onChange }: { hz: number; onChange: (hz: number) => void }) => {
    const fi = FREQUENCIES.indexOf(hz)
    const angle = -135 + (fi / (FREQUENCIES.length - 1)) * 270
    const DOT_COUNT = 60
    const dotColors = ['#0297d6']

    return (
        <div className="flex flex-col items-center gap-1 shrink-0">
            {/* Knob SVG */}
            <div className="relative w-40 h-40 md:w-52 md:h-52">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 176 176">
                    {/* Coloured dots ring */}
                    {Array.from({ length: DOT_COUNT }).map((_, i) => {
                        const a = -135 + (i / (DOT_COUNT - 1)) * 270
                        const rad = (a * Math.PI) / 180
                        const cx = 88 + 82 * Math.cos(rad)
                        const cy = 88 + 82 * Math.sin(rad)
                        const active = i <= (fi / (FREQUENCIES.length - 1)) * (DOT_COUNT - 1)
                        return (
                            <circle
                                key={i}
                                cx={cx} cy={cy}
                                r={active ? 2.8 : 1.8}
                                fill={active ? dotColors[i % dotColors.length] : '#e2e8f0'}
                                opacity={active ? 1 : 0.6}
                            />
                        )
                    })}

                    {/* Tick marks at each frequency */}
                    {FREQUENCIES.map((f, i) => {
                        const a = -135 + (i / (FREQUENCIES.length - 1)) * 270
                        const rad = (a * Math.PI) / 180
                        return (
                            <line
                                key={f}
                                x1={88 + 72 * Math.cos(rad)} y1={88 + 72 * Math.sin(rad)}
                                x2={88 + 60 * Math.cos(rad)} y2={88 + 60 * Math.sin(rad)}
                                stroke={i === fi ? '#0297d6' : '#cbd5e1'}
                                strokeWidth={i === fi ? 3 : 1.5}
                                strokeLinecap="round"
                            />
                        )
                    })}

                    {/* Knob face */}
                    <circle cx="88" cy="88" r="62"
                        fill="white" stroke="#e2e8f0" strokeWidth="1.5"
                        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.10))' }}
                    />

                    {/* Hz label inside knob */}
                    <text x="88" y="80" textAnchor="middle"
                        fontSize="22" fontWeight="700" fill="#0297d6" fontFamily="sans-serif">
                        {hz >= 1000 ? `${hz / 1000}k` : hz}
                    </text>
                    <text x="88" y="104" textAnchor="middle"
                        fontSize="15" fontWeight="600" fill="#94a3b8" fontFamily="sans-serif">
                        {hz >= 1000 ? 'kHz' : 'Hz'}
                    </text>
                </svg>

                {/* Click zones */}
                <button
                    onClick={() => fi > 0 && onChange(FREQUENCIES[fi - 1])}
                    className="absolute inset-0 left-0 w-1/2 h-full opacity-0 cursor-w-resize"
                    aria-label="Lower frequency"
                />
                <button
                    onClick={() => fi < FREQUENCIES.length - 1 && onChange(FREQUENCIES[fi + 1])}
                    className="absolute left-1/2 top-0 w-1/2 h-full opacity-0 cursor-e-resize"
                    aria-label="Higher frequency"
                />
            </div>

            {/* ‹ label › */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => fi > 0 && onChange(FREQUENCIES[fi - 1])}
                    disabled={fi === 0}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-25 flex items-center justify-center text-slate-600 text-base font-bold transition-colors"
                >‹</button>
                <span className="text-sm text-slate-500 font-bold w-16 text-center">
                    {hz >= 1000 ? `${hz / 1000}kHz` : `${hz}Hz`}
                </span>
                <button
                    onClick={() => fi < FREQUENCIES.length - 1 && onChange(FREQUENCIES[fi + 1])}
                    disabled={fi === FREQUENCIES.length - 1}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-25 flex items-center justify-center text-slate-600 text-base font-bold transition-colors"
                >›</button>
            </div>
        </div>
    )
}

// ─── dB vertical scale ────────────────────────────────────────────────────────
const DbScale = ({ currentDb }: { currentDb: number }) => (
    <div className="flex flex-col-reverse items-end lg:gap-0.5 md:gap-7.5 shrink-0 select-none">
        {DB_LEVELS.map(db => (
            <div key={db} className="flex items-center gap-0.75">
                <span className="text-[9px] md:text-[15px] lg:text-[14px] text-slate-400 w-7 text-right leading-none tabular-nums">
                    {db}
                </span>
                <div
                    className="h-2 md:h-2.25 w-1.25 md:w-1.5 rounded-sm transition-colors duration-150"
                    style={{ backgroundColor: currentDb >= db ? '#0297d6' : '#f1f5f9' }}
                />
            </div>
        ))}
        <div className="flex items-center gap-0.75 mt-0.5">
            <span className="text-[9px] font-black text-[#0297d6] w-7 text-right">◄</span>
            <div className="w-1.25 md:w-1.5" />
        </div>
    </div>
)

// ─── Headphone modal ──────────────────────────────────────────────────────────
const HeadphoneModal = ({ onConfirm, onSkip }: { onConfirm: () => void; onSkip: () => void }) => (
    <div className="fixed inset-0 bg-black/40 z-70 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5">
            <div className="text-6xl">🎧</div>
            <h2 className="text-lg font-black text-slate-800 text-center">Connect Headphones First</h2>
            <p className="text-sm text-slate-500 text-center leading-relaxed">
                Plug in <span className="font-bold text-slate-700">wired headphones</span> before starting.
                <br /><br />
                Each ear is tested separately. The test plays pure tones at different
                pitches — tap <strong>YES</strong> the moment you hear the sound.
            </p>
            <button
                onClick={onConfirm}
                className="w-full bg-[#0297d6] text-white font-bold py-3 rounded-xl hover:bg-[#0280bb] transition-colors"
            >
                🎧 Headphones Connected — Start
            </button>
            <button
                onClick={onSkip}
                className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
            >
                Skip Hearing Test
            </button>
        </div>
    </div>
)

// ─── Ear icon ─────────────────────────────────────────────────────────────────
const EarIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M12 1C8.7 1 6 3.7 6 7c0 2.4 1.4 4.5 3.4 5.6.6.3 1 .9 1 1.6V17a2 2 0 0 0 4 0v-1h.6A3.4 3.4 0 0 0 18 12.6V7c0-3.3-2.7-6-6-6z" />
    </svg>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
const HearingTestPage: React.FC<HearingTestPageProps> = ({
    onNext, onSkip, onBack,
    sessionName = '', sessionPhone = '', sessionToken = '',
    vitalsId,
    prefetchedData,
}) => {
    const hasPrefetchedResult = !!(
        prefetchedData &&
        prefetchedData.leftEarResult &&
        prefetchedData.leftEarResult !== 'Not Performed'
    )
    const [showPrefetchDialog, setShowPrefetchDialog] = useState(hasPrefetchedResult)
    const [showModal, setShowModal] = useState(!hasPrefetchedResult)
    const [isFinishing, setIsFinishing] = useState(false)
    const [currentHz, setCurrentHz] = useState(250)
    const [currentDb, setCurrentDb] = useState(20)
    const [activeEar, setActiveEar] = useState<'left' | 'right'>('left')
    const [playing, setPlaying] = useState(false)
    const [leftThresholds, setLeftThresholds] = useState<Record<number, number>>({})
    const [rightThresholds, setRightThresholds] = useState<Record<number, number>>({})

    const audioCtxRef = useRef<AudioContext | null>(null)
    const stopToneRef = useRef<(() => void) | null>(null)

    useEffect(() => () => { stopToneRef.current?.() }, [])

    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return audioCtxRef.current
    }, [])

    const stopCurrentTone = useCallback(() => {
        stopToneRef.current?.()
        stopToneRef.current = null
        setPlaying(false)
    }, [])

    const handlePlay = useCallback(() => {
        if (playing) { stopCurrentTone(); return }
        const ctx = getAudioCtx()
        if (ctx.state === 'suspended') ctx.resume()
        stopCurrentTone()
        setPlaying(true)
        stopToneRef.current = startTone(ctx, currentHz, currentDb, activeEar)
    }, [playing, currentHz, currentDb, activeEar, getAudioCtx, stopCurrentTone])

    // Restart tone live when hz/db/ear changes while playing
    useEffect(() => {
        if (!playing) return
        const ctx = getAudioCtx()
        stopToneRef.current?.()
        stopToneRef.current = startTone(ctx, currentHz, currentDb, activeEar)
    }, [currentHz, currentDb, activeEar]) // eslint-disable-line

    const handleDbChange = (dir: 'up' | 'down') => {
        setCurrentDb(prev => {
            const idx = DB_LEVELS.indexOf(prev)
            return dir === 'up'
                ? DB_LEVELS[Math.min(idx + 1, DB_LEVELS.length - 1)]
                : DB_LEVELS[Math.max(idx - 1, 0)]
        })
    }

    const recordAndAdvance = useCallback((heard: boolean) => {
        stopCurrentTone()
        if (heard) {
            const setter = activeEar === 'left' ? setLeftThresholds : setRightThresholds
            setter(prev => ({ ...prev, [currentHz]: currentDb }))
        }
        const thresholds = activeEar === 'left' ? leftThresholds : rightThresholds
        const nextHz = FREQUENCIES.find(f => f > currentHz && !(f in thresholds))
        if (nextHz) {
            setCurrentHz(nextHz)
            setCurrentDb(20)
        }
    }, [activeEar, currentHz, currentDb, leftThresholds, rightThresholds, stopCurrentTone])

    const switchEar = (ear: 'left' | 'right') => {
        stopCurrentTone()
        setActiveEar(ear)
        const thresholds = ear === 'left' ? leftThresholds : rightThresholds
        const first = FREQUENCIES.find(f => !(f in thresholds)) ?? FREQUENCIES[0]
        setCurrentHz(first)
        setCurrentDb(20)
    }

    const handleFinish = () => {
        setIsFinishing(true)
        stopCurrentTone()
        onNext({
            leftEar: leftThresholds,
            rightEar: rightThresholds,
            leftResult: getHearingResult(leftThresholds),
            rightResult: getHearingResult(rightThresholds),
            skipped: false,
        })
    }

    const leftDone = Object.keys(leftThresholds).length
    const rightDone = Object.keys(rightThresholds).length

    return (
        /*
         * Mobile  : overflow-y-auto  → scrollable
         * Desktop (md+): overflow-hidden → no scroll, fits screen
         * md:ml-16 → accounts for sidebar, same as EyeTestingPage
         */
        <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto md:overflow-hidden md:ml-16">

            {/* ── Previous Result Dialog ── */}
            {showPrefetchDialog && prefetchedData && (
                <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center gap-5">
                        <div className="text-5xl">🎧</div>
                        <h2 className="text-lg font-black text-slate-800 text-center">Previous Hearing Test Result</h2>
                        <div className="w-full bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Left Ear</span>
                                <span className={`font-bold ${prefetchedData.leftEarResult === 'Normal' ? 'text-green-500' : 'text-orange-500'}`}>
                                    {prefetchedData.leftEarResult ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Right Ear</span>
                                <span className={`font-bold ${prefetchedData.rightEarResult === 'Normal' ? 'text-green-500' : 'text-orange-500'}`}>
                                    {prefetchedData.rightEarResult ?? '—'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => {
                                    setShowPrefetchDialog(false)
                                    setShowModal(true)
                                }}
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

            {/* Headphone modal */}
            {showModal && (
                <HeadphoneModal
                    onConfirm={async () => {
                        setShowModal(false)

                        const ctx = getAudioCtx()

                        if (ctx.state === 'suspended') {
                            await ctx.resume()
                        }

                        await playDemoTone(ctx)
                    }}
                    onSkip={() => { stopCurrentTone(); onSkip() }}
                />
            )}

            {/* ── Navbar ── */}
            <NavBarTestPages
                title="Hearing Screening"
                sessionName={sessionName}
                sessionPhone={sessionPhone}
                sessionToken={sessionToken}
                rightSlot={
                    (leftDone === 0 && rightDone === 0) ? (
                        <button
                            onClick={() => { stopCurrentTone(); onSkip() }}
                            className="px-5 py-2 bg-white text-[#0297d6] font-bold rounded-full text-sm hover:bg-slate-100 transition-colors"
                        >
                            Skip
                        </button>
                    ) : undefined
                }
            />

            {/* ── Sub-header ── */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-2 shrink-0 flex items-center justify-between">
                <p className="text-sm text-slate-500 font-medium">
                    Adjust frequency &amp; volume → Play → tap YES when you hear it
                </p>
                <span className="text-xs font-bold text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-full whitespace-nowrap ml-2">
                    {leftDone + rightDone} / {FREQUENCIES.length * 2} recorded
                </span>
            </div>

            {/* ── Waveform + Play ── */}
            <div className="bg-white px-4 pt-3 pb-2 shrink-0 border-b border-slate-100">
                <WaveformBars playing={playing} />
                <div className="flex flex-col items-center mt-2 gap-0.5">
                    <button
                        onClick={handlePlay}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95
                            ${playing
                                ? 'bg-[#0297d6] text-white shadow-lg ring-4 ring-[#0297d6]/30'
                                : 'bg-white border-2 border-slate-200 text-[#0297d6] hover:shadow-lg'
                            }`}
                    >
                        {playing
                            ? <span className="text-sm">■</span>
                            : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        }
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold">
                        {playing ? 'Playing — tap to stop' : 'Play'}
                    </span>
                </div>
            </div>

            {/* ── Main Controls ──
                Mobile  : flex-col, centred, stacked
                Desktop : flex-row, single line, space-between
            */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center
                            gap-6 md:gap-0 md:justify-around
                            px-4 md:px-8 py-4 md:py-0
                            min-h-0">

                {/* LEFT side: knob + Hz card */}
                <div className="flex flex-col lg:flex-row items-center gap-4 md:gap-6">
                    <div className='mb-20'>
                        <FreqKnob hz={currentHz} onChange={setCurrentHz} />
                    </div>
                    {/* Hz card */}
                    <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-slate-200 bg-white shadow-sm shrink-0">
                        <span className="text-[#0297d6] text-2xl md:text-3xl font-black leading-none">
                            {currentHz >= 1000 ? currentHz / 1000 : currentHz}
                        </span>
                        <span className="text-slate-400 text-xs md:text-sm font-bold">
                            {currentHz >= 1000 ? 'kHz' : 'Hz'}
                        </span>
                    </div>

                </div>

                {/* Divider — vertical on desktop, horizontal on mobile */}
                <div className="hidden md:block w-px h-32 bg-slate-100 shrink-0" />
                <div className="block md:hidden w-full h-px bg-slate-100 shrink-0" />

                {/* RIGHT side: +/− | dB scale | dB card */}
                <div className="flex items-center gap-3 md:gap-6">
                    {/* +/− buttons */}
                    <div className="flex flex-col gap-3 shrink-0">
                        <button
                            onClick={() => handleDbChange('up')}
                            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#0297d6] text-white text-xl font-bold flex items-center justify-center shadow hover:bg-[#0280bb] active:scale-95 transition-all"
                        >+</button>
                        <button
                            onClick={() => handleDbChange('down')}
                            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#0297d6] text-white text-xl font-bold flex items-center justify-center shadow hover:bg-[#0280bb] active:scale-95 transition-all"
                        >−</button>
                    </div>
                    <div className='lg:mb-8'>
                        {/* dB scale */}
                        <DbScale currentDb={currentDb} />
                    </div>


                    {/* dB card */}
                    <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-slate-200 bg-white shadow-sm shrink-0">
                        <span className="text-[#0297d6] text-2xl md:text-3xl font-black leading-none">
                            {currentDb}
                        </span>
                        <span className="text-slate-400 text-xs md:text-sm font-bold">dB</span>
                    </div>
                </div>
            </div>

            {/* ── Bottom section ── */}
            <div className="shrink-0 border-t border-slate-100 bg-white">

                {/* Ear tabs */}
                <div className="flex border-b border-slate-100">
                    {(['left', 'right'] as const).map(ear => {
                        const done = ear === 'left' ? leftDone : rightDone
                        const thresholds = ear === 'left' ? leftThresholds : rightThresholds
                        const lastHz = done > 0 ? Math.max(...Object.keys(thresholds).map(Number)) : null
                        const isActive = activeEar === ear
                        return (
                            <button
                                key={ear}
                                onClick={() => {
                                    const otherEar = ear === 'left' ? 'right' : 'left';
                                    const otherDone = otherEar === 'left' ? leftDone : rightDone;
                                    const thisDone = ear === 'left' ? leftDone : rightDone;
                                    // If the other ear is fully done but this one isn't started yet, allow
                                    // If this ear is partially done, block switching away
                                    if (activeEar !== ear) switchEar(ear);
                                }}
                                className={`flex-1 flex items-center justify-between px-4 py-2.5 transition-colors
                                    ${isActive
                                        ? 'border-b-2 border-[#0297d6] bg-[#0297d6]/5'
                                        : 'hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <EarIcon className={`w-4 h-4 ${isActive ? 'text-[#0297d6]' : 'text-slate-400'}`} />
                                    <span className={`text-sm font-black capitalize ${isActive ? 'text-[#0297d6]' : 'text-slate-500'}`}>
                                        {ear} Ear
                                    </span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                    ${done > 0 ? 'bg-[#0297d6]/10 text-[#0297d6]' : 'bg-slate-100 text-slate-400'}`}>
                                    {lastHz
                                        ? `${lastHz >= 1000 ? lastHz / 1000 + 'k' : lastHz}Hz`
                                        : '—'
                                    }&nbsp;&nbsp;{done}/{FREQUENCIES.length}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3">
                    <button
                        onClick={() => { stopCurrentTone(); onBack() }}
                        className="px-3 md:px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                    >← Back</button>

                    <button
                        onClick={() => recordAndAdvance(false)}
                        className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-sm hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all"
                    >Can't Hear</button>

                    <button
                        onClick={() => recordAndAdvance(true)}
                        className="flex-1 py-2.5 rounded-xl bg-[#0297d6] text-white font-black text-sm hover:bg-[#0280bb] transition-all shadow-md"
                    >YES, I Hear It</button>

                    <button
                        onClick={() => {
                            if (leftDone > 0 && rightDone === 0) {
                                alert("Please complete the Right Ear test before finishing.");
                                switchEar('right');
                                return;
                            }
                            if (rightDone > 0 && leftDone === 0) {
                                alert("Please complete the Left Ear test before finishing.");
                                switchEar('left');
                                return;
                            }
                            handleFinish();
                        }}
                        disabled={isFinishing}
                        className={`px-3 md:px-4 py-2.5 text-sm font-bold rounded-xl transition-colors shrink-0 flex items-center gap-2
        ${isFinishing ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    >
                        {isFinishing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            'Finish'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HearingTestPage