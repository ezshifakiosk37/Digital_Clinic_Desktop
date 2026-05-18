'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — adjust these to match your physical setup
// ─────────────────────────────────────────────────────────────────────────────
const CAMERA_HEIGHT_INCHES = 48;        // Camera is exactly 4 ft = 48 inches from floor
const PATIENT_DISTANCE_INCHES = 102;    // Patient stands ~8 ft 6 in = 102 inches away
// Typical tablet camera vertical FoV ≈ 60°. Half-angle = 30°.
// Visible height at distance D = 2 * D * tan(halfFovRad)
const CAMERA_VFOV_DEG = 60;            // Vertical field of view in degrees (adjust if needed)

// Derived: total real-world height visible in frame at patient distance
const halfFovRad = (CAMERA_VFOV_DEG / 2) * (Math.PI / 180);
const VISIBLE_HEIGHT_INCHES = 2 * PATIENT_DISTANCE_INCHES * Math.tan(halfFovRad);

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

    const [step, setStep] = useState<Step>('intro');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });
    const [imgDisplayRect, setImgDisplayRect] = useState({ top: 0, height: 1 });
    const [barY, setBarY] = useState<number>(100);          // px from top of the displayed image
    const [isDragging, setIsDragging] = useState(false);
    const [calculatedHeight, setCalculatedHeight] = useState<string>('');
    const [cameraError, setCameraError] = useState<string>('');
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Reset when modal opens ──────────────────────────────────────────────────
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

    // ── Camera lifecycle ────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            setCameraError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setStep('camera');
        } catch (err: any) {
            setCameraError('Camera access denied. Please allow camera permission and try again.');
            console.error('Camera error:', err);
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ── Capture photo ───────────────────────────────────────────────────────────
    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        setImgNaturalSize({ w: video.videoWidth, h: video.videoHeight });
        stopCamera();
        setStep('adjust');
    }, [stopCamera]);

    // ── After image renders, measure its displayed size ─────────────────────────
    const onImgLoad = useCallback(() => {
        if (!imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        setImgDisplayRect({ top: rect.top, height: rect.height });
        // Start bar at ~20% from top (near head region)
        setBarY(rect.height * 0.2);
    }, []);

    // ── Drag handlers ───────────────────────────────────────────────────────────
    const clampBarY = (y: number, displayH: number) => Math.max(0, Math.min(displayH - 1, y));

    const getRelativeY = (clientY: number) => {
        if (!imgRef.current) return 0;
        const rect = imgRef.current.getBoundingClientRect();
        return clientY - rect.top;
    };

    const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsDragging(true); };
    const onTouchStart = (e: React.TouchEvent) => { setIsDragging(true); };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        setBarY(clampBarY(e.clientY - rect.top, rect.height));
    }, [isDragging]);

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || !imgRef.current) return;
        e.preventDefault();
        const rect = imgRef.current.getBoundingClientRect();
        setBarY(clampBarY(e.touches[0].clientY - rect.top, rect.height));
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

    // ── Height calculation ──────────────────────────────────────────────────────
    // barY = pixels from top of displayed image to the red bar (top of patient's head)
    // displayH = total displayed image height in pixels
    // The image represents VISIBLE_HEIGHT_INCHES of real height.
    // pixelsPerInch = displayH / VISIBLE_HEIGHT_INCHES
    // The bottom of the image = floor level.
    // Patient height in inches = (displayH - barY) / (displayH / VISIBLE_HEIGHT_INCHES)
    const calculateHeight = useCallback(() => {
        if (!imgRef.current) return;
        const displayH = imgRef.current.getBoundingClientRect().height;
        if (!displayH) return;

        const pixelsPerInch = displayH / VISIBLE_HEIGHT_INCHES;
        const heightInches = Math.round((displayH - barY) / pixelsPerInch);

        // Convert total inches → feet and inches
        const feet = Math.floor(heightInches / 12);
        const inches = heightInches % 12;

        // Store as "feet.inches" format (e.g. "5.10")
        const formatted = `${feet}.${inches}`;
        setCalculatedHeight(formatted);
        setStep('confirm');
    }, [barY]);

    // ── Display helper ──────────────────────────────────────────────────────────
    const displayHeight = (val: string) => {
        if (!val) return '—';
        const [f, i] = val.split('.');
        return `${f} ft ${i ?? 0} in`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

                {/* ── STEP: INTRO ── */}
                {step === 'intro' && (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-[#0297d6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#0297d6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Measure Height</h2>
                        <p className="text-sm text-slate-500 mb-1">Please hold still.</p>
                        <p className="text-sm text-slate-500 mb-4">
                            Stand <strong>~8½ ft</strong> away so your <strong>full body</strong> is visible in the frame, then tap <strong>Capture</strong>.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700 text-left">
                            <span className="font-bold">📐 Setup:</span> Camera is mounted at <strong>4 ft</strong> height. Patient must stand fully in frame for accurate reading.
                        </div>
                        {cameraError && (
                            <p className="text-red-500 text-sm mb-4">{cameraError}</p>
                        )}
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                                Cancel
                            </button>
                            <button onClick={startCamera} className="flex-1 py-3 rounded-xl bg-[#0297d6] text-white font-bold text-sm hover:bg-[#0286c2]">
                                Open Camera
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP: CAMERA ── */}
                {step === 'camera' && (
                    <div className="flex flex-col">
                        <div className="relative bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-[65vh] object-cover"
                            />
                            {/* Guide overlay */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-4">
                                <div className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    Make sure full body is visible ↕
                                </div>
                                <div className="border-2 border-white/40 border-dashed rounded-xl mx-6 flex-1 mt-2 mb-2 w-[calc(100%-3rem)]" />
                                <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                                    Floor should be at the bottom
                                </div>
                            </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="p-4 flex gap-3">
                            <button onClick={() => { stopCamera(); setStep('intro'); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                                ← Back
                            </button>
                            <button onClick={capturePhoto} className="flex-1 py-3 rounded-xl bg-[#0297d6] text-white font-bold text-sm hover:bg-[#0286c2]">
                                📸 Capture
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP: ADJUST BAR ── */}
                {step === 'adjust' && capturedImage && (
                    <div className="flex flex-col">
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-sm font-bold text-slate-800">Drag the red line to the top of the head</p>
                            <p className="text-xs text-slate-400 mt-0.5">Touch and drag the red bar precisely to the crown of the head</p>
                        </div>

                        {/* Image + draggable bar */}
                        <div
                            ref={containerRef}
                            className="relative mx-4 rounded-xl overflow-hidden bg-black select-none"
                            style={{ touchAction: 'none' }}
                        >
                            <img
                                ref={imgRef}
                                src={capturedImage}
                                alt="Captured"
                                onLoad={onImgLoad}
                                className="w-full object-contain max-h-[55vh]"
                                draggable={false}
                            />

                            {/* Red bar */}
                            <div
                                className="absolute left-0 right-0 cursor-row-resize z-10"
                                style={{ top: barY - 12, height: 24, touchAction: 'none' }}
                                onMouseDown={onMouseDown}
                                onTouchStart={onTouchStart}
                            >
                                {/* Visible line */}
                                <div
                                    className="absolute left-0 right-0"
                                    style={{ top: 11, height: 2, background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }}
                                />
                                {/* Drag handle */}
                                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                                    </svg>
                                </div>
                            </div>

                            {/* Floor indicator */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400/60" />
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                Floor ↓
                            </div>
                        </div>

                        <div className="p-4 flex gap-3">
                            <button onClick={() => { setCapturedImage(null); startCamera(); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                                Retake
                            </button>
                            <button onClick={calculateHeight} className="flex-1 py-3 rounded-xl bg-[#0297d6] text-white font-bold text-sm hover:bg-[#0286c2]">
                                Calculate →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP: CONFIRM ── */}
                {step === 'confirm' && (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Height Calculated</h2>
                        <p className="text-4xl font-extrabold text-[#0297d6] my-4">{displayHeight(calculatedHeight)}</p>
                        <p className="text-xs text-slate-400 mb-6">
                            Based on camera at 4 ft · patient at ~8.5 ft distance
                        </p>

                        {/* Preview of captured image */}
                        {capturedImage && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-slate-100 max-h-32">
                                <img src={capturedImage} alt="Captured" className="w-full object-contain max-h-32" />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setStep('adjust')} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">
                                ← Adjust
                            </button>
                            <button
                                onClick={() => { onConfirm(calculatedHeight); onClose(); }}
                                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600"
                            >
                                Use This Height ✓
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeightCameraModal;