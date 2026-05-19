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
const CAMERA_HEIGHT_FT = 4;           // Camera mounted at 4 ft
const PATIENT_DISTANCE_FT = 6;        // Patient stands 6 ft away
const CAMERA_VFOV_DEG = 60;           // Vertical FOV of tablet camera (degrees)

// Derived visible height at patient's distance
const halfFovRad = (CAMERA_VFOV_DEG / 2) * (Math.PI / 180);
const VISIBLE_HEIGHT_INCHES = 2 * (PATIENT_DISTANCE_FT * 12) * Math.tan(halfFovRad);
// ≈ 83.1 inches at 6 ft with 60° FOV

// ─────────────────────────────────────────────────────────────────────────────

interface HeightCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (heightFeetDotInches: string) => void; // e.g. "5.10"
}

type Step = 'intro' | 'camera' | 'adjust' | 'confirm';

const HeightCameraModal: React.FC<HeightCameraModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [step, setStep] = useState<Step>('intro');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [barY, setBarY] = useState<number>(100);
    const [isDragging, setIsDragging] = useState(false);
    const [calculatedHeight, setCalculatedHeight] = useState<string>('');
    const [cameraError, setCameraError] = useState<string>('');
    const [imgDisplayH, setImgDisplayH] = useState(1);

    // ── Reset on open/close ──────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setStep('intro');
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
        const heightInches = Math.round((pixelsFromHeadToFloor / displayH) * VISIBLE_HEIGHT_INCHES);

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

            {/* ── STEP: INTRO ── */}
            {step === 'intro' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-black/40 backdrop-blur-sm">
                        <span className="text-white font-bold text-lg tracking-tight">Height Measurement</span>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Icon */}
                    <div className="w-24 h-24 rounded-3xl bg-[#0297d6]/20 border border-[#0297d6]/30 flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-[#0297d6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-extrabold text-white mb-2 text-center">Measure Height</h2>
                    <p className="text-slate-400 text-center text-sm mb-8 max-w-xs leading-relaxed">
                        Stand <strong className="text-white">6 ft away</strong> from the camera so your full body — head to feet — is visible in frame.
                    </p>

                    {/* Setup info cards */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                            <div className="text-[#0297d6] text-2xl font-black mb-1">4 ft</div>
                            <div className="text-slate-400 text-xs">Camera height</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                            <div className="text-[#0297d6] text-2xl font-black mb-1">6 ft</div>
                            <div className="text-slate-400 text-xs">Stand here</div>
                        </div>
                    </div>

                    {/* Floor marker reminder */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 w-full max-w-xs mb-8">
                        <div className="flex items-start gap-2">
                            <span className="text-amber-400 text-base mt-0.5">📐</span>
                            <p className="text-amber-300 text-xs leading-relaxed">
                                Ensure the <strong>floor is visible</strong> at the bottom of the frame. Camera should be tilted slightly downward.
                            </p>
                        </div>
                    </div>

                    {cameraError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 w-full max-w-xs mb-4">
                            <p className="text-red-400 text-xs text-center">{cameraError}</p>
                        </div>
                    )}

                    <button
                        onClick={startCamera}
                        className="w-full max-w-xs py-4 rounded-2xl bg-[#0297d6] hover:bg-[#0286c2] text-white font-bold text-base transition-colors shadow-lg shadow-[#0297d6]/30"
                    >
                        Open Camera
                    </button>
                </div>
            )}

            {/* ── STEP: CAMERA ── */}
            {step === 'camera' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <Webcam
                        ref={videoRef as any}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user' }}
                        style={{ width: '100%', flex: 1, objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ background: '#111', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <p style={{ color: '#888', fontSize: 12, margin: 0 }}>Floor visible at bottom · Stand 6 ft away</p>
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
                        <button onClick={() => { stopCamera(); setStep('intro'); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13 }}>
                            ← Back
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
                            {/* Drag handle — center */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
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