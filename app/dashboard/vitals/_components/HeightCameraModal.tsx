'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL SETUP — adjust these to match your real-world installation
// ─────────────────────────────────────────────────────────────────────────────
//
//  GEOMETRY EXPLAINED:
//
//  Camera is mounted at 4 ft, tilted so the floor is visible at
//  the bottom edge of the frame at the standing mark (6 ft away).
//
//  Visible vertical scene height at distance D:
//    visibleH = 2 × D × tan(FOV/2)
//
//  At D = 6 ft, FOV = 60°:
//    visibleH = 2 × 6 × tan(30°) = 2 × 6 × 0.5774 ≈ 6.93 ft = 83.1 inches
//
//  Person's real height:
//    realHeight = (pixelsFromBarToBottom / totalDisplayPixels) × visibleH
//
//  The bottom of the frame = floor level (camera tilted to ensure this).
//  The red bar = top of person's head.
//  So height = fraction of frame from head to floor × total visible height.
//
// ─────────────────────────────────────────────────────────────────────────────
const PATIENT_DISTANCE_FT = 6;
const CAMERA_VFOV_DEG = 60;

const halfFovRad = (CAMERA_VFOV_DEG / 2) * (Math.PI / 180);
const VISIBLE_HEIGHT_INCHES = 2 * (PATIENT_DISTANCE_FT * 12) * Math.tan(halfFovRad);

// ── CALIBRATION ──────────────────────────────────────────────────────────────
// Step 1: Ek banda jo exactly 5ft 8in (68 inches) ka ho, 6ft pe khara karo
// Step 2: Bar uske sir pe lagao, Calculate karo
// Step 3: Jo result aaye usse 68 se divide karo → ye tera CALIBRATION_FACTOR hai
// Step 4: Neeche wali value adjust karo jab tak result 68 inches na aaye
//
// Example: app ne 74 inches bataya, actual 68 hai
// CALIBRATION_FACTOR = 68 / 74 = 0.918
//
// Agar app chhota bata raha hai: factor 1 se bada karo (e.g. 1.08)
// Agar app bada bata raha hai:  factor 1 se chhota karo (e.g. 0.92)
// ─────────────────────────────────────────────────────────────────────────────
const CALIBRATION_FACTOR = 1.04; // ← SIRF YE EK NUMBER CHANGE KARO

// ─────────────────────────────────────────────────────────────────────────────

interface HeightCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (heightFeetDotInches: string) => void; // e.g. "5.10"
}

type Step ='guide' | 'camera' | 'adjust' | 'confirm';

const HeightCameraModal: React.FC<HeightCameraModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [step, setStep] = useState<Step>('guide');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [barY, setBarY] = useState<number>(100);
    const [isDragging, setIsDragging] = useState(false);
    const [calculatedHeight, setCalculatedHeight] = useState<string>('');
    const [cameraError, setCameraError] = useState<string>('');
    const [imgDisplayH, setImgDisplayH] = useState(1);

    // ── Reset on open/close ──────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setStep('guide');
            setCapturedImage(null);
            setCalculatedHeight('');
            setCameraError('');
        } else {
            stopCamera();
        }
    }, [isOpen]);

    // ── Lock body scroll when open ───────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // ── Camera ───────────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraError('');
        setStep('camera');
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ── Capture ──────────────────────────────────────────────────────────────
    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
        setStep('adjust');
    }, [stopCamera]);

    // ── Image load — measure displayed height, init bar near top ────────────
    const onImgLoad = useCallback(() => {
        if (!imgRef.current) return;
        const h = imgRef.current.getBoundingClientRect().height;
        setImgDisplayH(h);
        setBarY(h * 0.18); // start near top (head region)
    }, []);

    // ── Drag ─────────────────────────────────────────────────────────────────
    const clamp = (y: number, max: number) => Math.max(0, Math.min(max - 2, y));

    const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsDragging(true); };
    const onTouchStart = (e: React.TouchEvent) => { setIsDragging(true); };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        setBarY(clamp(e.clientY - rect.top, rect.height));
    }, [isDragging]);

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !imgRef.current) return;
        e.preventDefault();
        const rect = imgRef.current.getBoundingClientRect();
        setBarY(clamp(e.touches[0].clientY - rect.top, rect.height));
    }, [isDragging]);

    const onDragEnd = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onDragEnd);
        };
    }, [onMouseMove, onTouchMove, onDragEnd]);

    // ── Height calculation ───────────────────────────────────────────────────
    //
    //  realHeight (inches) = (pixelsFromBarToBottom / totalDisplayPixels) × VISIBLE_HEIGHT_INCHES
    //
    //  pixelsFromBarToBottom = displayH - barY
    //  (because barY is measured from the top of the image,
    //   and the bottom of the image = floor level)
    //
    const calculateHeight = useCallback(() => {
        if (!imgRef.current) return;
        const displayH = imgRef.current.getBoundingClientRect().height;
        if (!displayH) return;

        const pixelsFromHeadToFloor = displayH - barY;
        const heightInches = Math.round((pixelsFromHeadToFloor / displayH) * VISIBLE_HEIGHT_INCHES * CALIBRATION_FACTOR);

        const feet = Math.floor(heightInches / 12);
        const inches = heightInches % 12;
        setCalculatedHeight(`${feet}.${inches}`);
        setStep('confirm');
    }, [barY]);

    // ── Display helper ───────────────────────────────────────────────────────
    const displayHeight = (val: string) => {
        if (!val) return '—';
        const [f, i] = val.split('.');
        return `${f} ft ${i ?? 0} in`;
    };

    if (!isOpen) return null;

    // ── FULLSCREEN WRAPPER ────────────────────────────────────────────────────
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: '#000',
                display: 'flex',
                flexDirection: 'column',
                width: '100vw',
                height: '100dvh',
                touchAction: 'none',
            }}
        >

            {/* ── STEP: GUIDE ── */}
            {step === 'guide' && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: '#fff', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ width: '100%', padding: '16px 20px', background: '#0297d6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>←</button>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Height Measurement</span>
                        <div style={{ width: 24 }} />
                    </div>

                    {/* Instruction text */}
                    <div style={{ textAlign: 'center', padding: '20px 24px 8px' }}>
                        <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                            Please <span style={{ color: '#0297d6' }}>Hold Still</span> — Device will take your height
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginTop: 6 }}>
                            TAP <span style={{ color: '#0297d6' }}>"Measure Height"</span> to open camera
                        </p>
                    </div>

                    {/* Person + ruler illustration */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', maxWidth: 400 }}>
                        {/* Ruler on left */}
                        <div style={{ position: 'absolute', left: 40, top: '5%', bottom: '5%', width: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            {[150,140,130,120,110,100,90,80,70,60,50,40,30,20,10].map(n => (
                                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: n % 50 === 0 ? 20 : 12, height: 1, background: '#475569' }} />
                                    <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{n}</span>
                                </div>
                            ))}
                        </div>

                        {/* Person silhouette */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 40 }}>
                            {/* Head */}
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#7c5c44', marginBottom: 4, border: '3px solid #0297d6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: 24 }}>👤</div>
                            </div>
                            {/* Body */}
                            <div style={{ width: 80, height: 120, background: '#1e293b', borderRadius: 8 }} />
                            {/* Legs */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <div style={{ width: 32, height: 100, background: '#d4a574', borderRadius: 4 }} />
                                <div style={{ width: 32, height: 100, background: '#d4a574', borderRadius: 4 }} />
                            </div>
                            {/* Feet */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                                <div style={{ width: 40, height: 16, background: '#374151', borderRadius: 8 }} />
                                <div style={{ width: 40, height: 16, background: '#374151', borderRadius: 8 }} />
                            </div>
                        </div>

                        {/* Blue stand bars */}
                        <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 8, background: '#1d4ed8', borderRadius: 4 }} />
                        <div style={{ position: 'absolute', right: '15%', top: 0, bottom: 0, width: 8, background: '#1d4ed8', borderRadius: 4 }} />
                    </div>

                    {/* Bottom button */}
                    <div style={{ width: '100%', padding: '16px', flexShrink: 0 }}>
                        <button
                            onClick={startCamera}
                            style={{ width: '100%', padding: '18px', background: '#0297d6', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
                        >
                            Measure Height
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: CAMERA ── */}
            {step === 'camera' && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#000', zIndex: 99999 }}>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Top bar with back button */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
                        <button
                            onClick={() => { stopCamera(); setStep('guide'); }}
                            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}
                        >
                            ←
                        </button>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 600, marginLeft: 12 }}>Full body must be in frame</span>
                    </div>

                    {/* Webcam fills entire screen */}
                    <Webcam
                        ref={videoRef as any}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user' }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />

                    {/* Bottom capture button — overlaid on video */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 16px' }}>Floor visible at bottom · Stand 6 ft away</p>
                        <button
                            onClick={() => {
                                const imageSrc = (videoRef.current as any).getScreenshot();
                                setCapturedImage(imageSrc);
                                stopCamera();
                                setStep('adjust');
                            }}
                            style={{ width: 76, height: 76, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', padding: 6 }}
                        >
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0297d6' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: ADJUST BAR ── */}
            {step === 'adjust' && capturedImage && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000', padding: '16px', overflow: 'auto' }}>
                    {/* Top instruction bar */}
                    <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <button
                            onClick={() => { setCapturedImage(null); startCamera(); }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="text-center">
                            <p className="text-white font-bold text-sm">Drag to top of head</p>
                            <p className="text-white/50 text-xs">Red line = crown of head</p>
                        </div>
                        <div className="w-10" />
                    </div>

                    {/* Image — fixed aspect ratio, same as working app */}
                    <div
                        ref={containerRef}
                        style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '3/4', background: '#111', borderRadius: 24, overflow: 'hidden', touchAction: 'none', userSelect: 'none' }}
                    >
                        <img
                            ref={imgRef}
                            src={capturedImage}
                            alt="Captured"
                            onLoad={onImgLoad}
                            className="w-full h-full object-cover"
                            draggable={false}
                        />

                        {/* Floor indicator — bottom of image */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400/70 z-10" />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full z-10">
                            ↓ Floor Level
                        </div>

                        {/* Red draggable bar */}
                        <div
                            className="absolute left-0 right-0 z-20 cursor-row-resize"
                            style={{ top: barY - 16, height: 32, touchAction: 'none' }}
                            onMouseDown={onMouseDown}
                            onTouchStart={onTouchStart}
                        >
                            {/* Line */}
                            <div
                                className="absolute left-0 right-0"
                                style={{
                                    top: 15,
                                    height: 2,
                                    background: '#ef4444',
                                    boxShadow: '0 0 8px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4)',
                                }}
                            />
                            {/* Drag handle — RIGHT side */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                                </svg>
                            </div>
                            {/* Left label */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded">
                                HEAD
                            </div>
                        </div>
                    </div>

                    {/* Bottom calculate button */}
                    <div className="shrink-0 px-5 pb-8 pt-4 bg-black/80 backdrop-blur-sm">
                        <button
                            onClick={calculateHeight}
                            className="w-full py-4 rounded-2xl bg-[#0297d6] hover:bg-[#0286c2] text-white font-bold text-base transition-colors"
                        >
                            Calculate Height →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: CONFIRM ── */}
            {step === 'confirm' && (
                <div className="flex-1 flex flex-col bg-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-black/40 backdrop-blur-sm">
                        <button
                            onClick={() => setStep('adjust')}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-white font-bold">Height Calculated</span>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Preview image — fills most of screen */}
                    {capturedImage && (
                        <div className="flex-1 relative overflow-hidden">
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="absolute inset-0 w-full h-full object-contain opacity-60"
                            />
                            {/* Height result overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="bg-black/70 backdrop-blur-md rounded-3xl px-10 py-8 flex flex-col items-center border border-white/10">
                                    <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
                                        <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-white/60 text-sm mb-1">Measured Height</p>
                                    <p className="text-5xl font-black text-white mb-1">{displayHeight(calculatedHeight)}</p>
                                    <p className="text-white/40 text-xs mt-2">
                                        Camera 4 ft · Distance 6 ft · FOV {CAMERA_VFOV_DEG}°
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom actions */}
                    <div className="shrink-0 px-5 pb-8 pt-4 bg-black/40 backdrop-blur-sm flex gap-3">
                        <button
                            onClick={() => setStep('adjust')}
                            className="flex-1 py-4 rounded-2xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
                        >
                            ← Adjust
                        </button>
                        <button
                            onClick={() => { onConfirm(calculatedHeight); onClose(); }}
                            className="flex-1 py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-lg shadow-green-500/30"
                        >
                            Use This Height ✓
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeightCameraModal;