//HeightCameraModal.tsx

'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL CONSTANTS — measured from your actual kiosk
// DO NOT CHANGE unless you physically move the kiosk or remount the tablet
// ─────────────────────────────────────────────────────────────────────────────
const CAMERA_HEIGHT_INCHES = 49.2;   // Camera lens height from floor (4ft 1cm)
const PATIENT_DISTANCE_INCHES = 83;  // Horizontal distance: camera to black tape line
const CAMERA_VFOV_DEG = 60;          // Vertical field of view of tablet front camera
// ─────────────────────────────────────────────────────────────────────────────
//
// HOW THE MATH WORKS (no magic calibration factor needed):
//
//  The camera is at height H = 49.2" from the floor.
//  The patient stands at horizontal distance D = 83" away.
//  The camera points straight (0° tilt).
//
//  Each pixel row in the frame corresponds to a real vertical angle:
//    angle(pixelY) = (0.5 - pixelY/frameH) × VFOV_rad
//    positive = above camera center (looking up)
//    negative = below camera center (looking down)
//
//  The real-world height that pixel row maps to:
//    worldY(pixelY) = H + D × tan(angle(pixelY))
//
//  So for a person:
//    headWorldY = H + D × tan(angle(headPixelY))
//    floorWorldY = H + D × tan(angle(floorPixelY))  ← should be ~0
//    personHeight = headWorldY - floorWorldY
//
//  Since patient's heels touch the tape at distance D,
//  their floor position is known exactly → no guessing needed.
//
// ─────────────────────────────────────────────────────────────────────────────

const VFOV_RAD = (CAMERA_VFOV_DEG * Math.PI) / 180;

/**
 * Convert a pixel Y position (from top of frame) to real-world height in inches.
 * frameH = total display height of image in pixels
 */
const pixelToWorldHeight = (pixelY: number, frameH: number): number => {
    // Angle from camera horizontal: positive = up, negative = down
    const angle = (0.5 - pixelY / frameH) * VFOV_RAD;
    return CAMERA_HEIGHT_INCHES + PATIENT_DISTANCE_INCHES * Math.tan(angle);
};

// ─────────────────────────────────────────────────────────────────────────────

interface HeightCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (heightFeetDotInches: string) => void; // e.g. "5.10"
}

type Step = 'guide' | 'camera' | 'adjust' | 'confirm';

const HeightCameraModal: React.FC<HeightCameraModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const videoRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [step, setStep] = useState<Step>('guide');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [barY, setBarY] = useState<number>(100);         // head bar (red)
    //   const [floorBarY, setFloorBarY] = useState<number>(0); // floor bar (blue) — draggable
    const [floorBarY, setFloorBarY] = useState<number>(0); // floor bar (blue) — fixed at bottom
    const [activeBar, setActiveBar] = useState<'head' | 'floor' | null>(null);
    const [calculatedHeight, setCalculatedHeight] = useState<string>('');
    const [cameraError, setCameraError] = useState<string>('');
    const [imgDisplayH, setImgDisplayH] = useState(1);
    const [liveHeight, setLiveHeight] = useState<string>(''); // shows height as user drags

    // ── Reset on open/close ────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setStep('guide');
            setCapturedImage(null);
            setCalculatedHeight('');
            setLiveHeight('');
            setCameraError('');
        } else {
            stopCamera();
        }
    }, [isOpen]);

    // ── Lock body scroll when open ─────────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // ── Camera ─────────────────────────────────────────────────────────────────
    const startCamera = useCallback(() => {
        setCameraError('');
        setStep('camera');
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ── Capture ────────────────────────────────────────────────────────────────
    const capturePhoto = useCallback(() => {
        const imageSrc = videoRef.current?.getScreenshot?.();
        if (!imageSrc) return;
        setCapturedImage(imageSrc);
        stopCamera();
        setStep('adjust');
    }, [stopCamera]);

    // ── Image load — set initial bar positions ─────────────────────────────────
    const onImgLoad = useCallback(() => {
        if (!imgRef.current) return;
        const h = imgRef.current.getBoundingClientRect().height;
        setImgDisplayH(h);
        setBarY(h * 0.15);          // head bar near top
        setFloorBarY(h * 0.99);     // floor bar fixed at bottom
        // setFloorBarY(h * 0.88);     // floor bar near bottom (patient's feet)
    }, []);

    // ── Live height preview while dragging ────────────────────────────────────
    const computeLiveHeight = useCallback((headY: number, floorY: number, frameH: number) => {
        if (!frameH) return;
        const headWorldY = pixelToWorldHeight(headY, frameH);
        const floorWorldY = pixelToWorldHeight(floorY, frameH);
        const heightInches = Math.round(headWorldY - floorWorldY);
        if (heightInches <= 0 || heightInches > 120) return; // sanity check
        const feet = Math.floor(heightInches / 12);
        const inches = heightInches % 12;
        setLiveHeight(`${feet}ft ${inches}in`);
    }, []);

    // ── Drag logic ─────────────────────────────────────────────────────────────
    const clamp = (y: number, max: number) => Math.max(0, Math.min(max - 2, y));

    const onHeadMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setActiveBar('head'); };
    // const onFloorMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setActiveBar('floor'); };
    const onFloorMouseDown = (_e: React.MouseEvent) => { };
    const onHeadTouchStart = () => setActiveBar('head');
    // const onFloorTouchStart = () => setActiveBar('floor');
    const onFloorTouchStart = () => { };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!activeBar || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const y = clamp(e.clientY - rect.top, rect.height);
        if (activeBar === 'head') {
            setBarY(y);
            computeLiveHeight(y, floorBarY, rect.height);
        } else {
            setFloorBarY(y);
            computeLiveHeight(barY, y, rect.height);
        }
    }, [activeBar, barY, floorBarY, computeLiveHeight]);

    const onTouchMove = useCallback((e: TouchEvent) => {
        if (!activeBar || !imgRef.current) return;
        e.preventDefault();
        const rect = imgRef.current.getBoundingClientRect();
        const y = clamp(e.touches[0].clientY - rect.top, rect.height);
        if (activeBar === 'head') {
            setBarY(y);
            computeLiveHeight(y, floorBarY, rect.height);
        } else {
            setFloorBarY(y);
            computeLiveHeight(barY, y, rect.height);
        }
    }, [activeBar, barY, floorBarY, computeLiveHeight]);

    const onDragEnd = useCallback(() => setActiveBar(null), []);

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

    // ── Height calculation ─────────────────────────────────────────────────────
    //
    //  Uses real physics — no calibration factor.
    //  headBarY  = pixel Y of top of head (from image top)
    //  floorBarY = pixel Y of patient's heels (from image top)
    //
    //  worldHeight(pixelY) = CAMERA_HEIGHT + DISTANCE × tan(angle(pixelY))
    //  personHeight = worldHeight(headBarY) - worldHeight(floorBarY)
    //
    const calculateHeight = useCallback(() => {
        if (!imgRef.current) return;
        const frameH = imgRef.current.getBoundingClientRect().height;
        if (!frameH) return;

        const headWorldY = pixelToWorldHeight(barY, frameH);
        const floorWorldY = pixelToWorldHeight(floorBarY, frameH);
        const heightInches = Math.round(headWorldY - floorWorldY);

        // Sanity check — reject impossible values
        if (heightInches < 24 || heightInches > 108) {
            alert('Measurement seems off. Please adjust the bars and try again.\n\nMake sure:\n• Red bar is at crown of head\n• Blue bar is at heel/floor level');
            return;
        }

        const feet = Math.floor(heightInches / 12);
        const inches = heightInches % 12;
        setCalculatedHeight(`${feet}.${inches}`);
        setStep('confirm');
    }, [barY, floorBarY]);

    // ── Display helper ─────────────────────────────────────────────────────────
    const displayHeight = (val: string) => {
        if (!val) return '—';
        const [f, i] = val.split('.');
        return `${f} ft ${i ?? 0} in`;
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000', display: 'flex', flexDirection: 'column',
            width: '100vw', height: '100dvh', touchAction: 'none',
        }}>

            {/* ── STEP: GUIDE ─────────────────────────────────────────────────────── */}
            {step === 'guide' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                    background: '#fff', zIndex: 99999, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        width: '100%', padding: '16px 20px', background: '#0297d6',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    }}>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>←</button>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Height Measurement</span>
                        <div style={{ width: 24 }} />
                    </div>

                    {/* Instructions */}
                    <div style={{ textAlign: 'center', padding: '24px 24px 12px' }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>
                            Stand on the <span style={{ color: '#0297d6' }}>black tape line</span>
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginTop: 8 }}>
                            Heels touching the tape · Stand straight · Look forward
                        </p>
                    </div>

                    {/* Visual diagram */}
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', width: '100%', maxWidth: 360, padding: '0 20px',
                    }}>
                        {/* Kiosk */}
                        <div style={{
                            position: 'absolute', left: 20, top: '10%', bottom: '10%',
                            width: 40, background: '#1d4ed8', borderRadius: 8,
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
                        }}>
                            <div style={{ width: 24, height: 16, background: '#0ea5e9', borderRadius: 4 }} />
                        </div>

                        {/* Arrow showing distance */}
                        <div style={{
                            position: 'absolute', left: 60, right: 80, bottom: '12%',
                            height: 2, background: '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{
                                background: '#f1f5f9', color: '#475569',
                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, whiteSpace: 'nowrap',
                            }}>
                                6 feets
                            </div>
                        </div>

                        {/* Person silhouette */}
                        <div style={{
                            position: 'absolute', right: 30,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: '#0297d6', marginBottom: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22,
                            }}>👤</div>
                            <div style={{ width: 56, height: 90, background: '#1e293b', borderRadius: 8 }} />
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                <div style={{ width: 22, height: 72, background: '#475569', borderRadius: 4 }} />
                                <div style={{ width: 22, height: 72, background: '#475569', borderRadius: 4 }} />
                            </div>
                            {/* Tape line at feet */}
                            <div style={{
                                width: 80, height: 6, background: '#111',
                                borderRadius: 3, marginTop: 2,
                            }} />
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginTop: 4 }}>
                                ← Stand here
                            </div>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div style={{ width: '100%', maxWidth: 360, padding: '0 24px 16px' }}>
                        {[
                            '✅ Heels touching the black tape',
                            '✅ Stand straight, feet together',
                            '✅ Look straight ahead',
                            '✅ Remove shoes if possible',
                        ].map((item, i) => (
                            <div key={i} style={{
                                fontSize: 13, fontWeight: 600, color: '#334155',
                                padding: '6px 0', borderBottom: '1px solid #f1f5f9',
                            }}>{item}</div>
                        ))}
                    </div>

                    {/* Button */}
                    <div style={{ width: '100%', padding: '12px 16px 24px', flexShrink: 0 }}>
                        <button
                            onClick={startCamera}
                            style={{
                                width: '100%', padding: '18px', background: '#0297d6',
                                color: 'white', border: 'none', borderRadius: 14,
                                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            Open Camera →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: CAMERA ────────────────────────────────────────────────────── */}
            {step === 'camera' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                    display: 'flex', flexDirection: 'column', background: '#000', zIndex: 99999,
                }}>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Top bar */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                        display: 'flex', alignItems: 'center', padding: '16px',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                    }}>
                        <button
                            onClick={() => { stopCamera(); setStep('guide'); }}
                            style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.15)', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: 'white', fontSize: 20,
                            }}
                        >←</button>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 600, marginLeft: 12 }}>
                            Full body must be visible · Heels on tape
                        </span>
                    </div>

                    {/* Webcam */}
                    <Webcam
                        ref={videoRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user' }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />

                    {/* Bottom capture */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '24px 16px 40px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    }}>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 16px', fontWeight: 600 }}>
                            Heels touching black tape · Full body in frame
                        </p>
                        <button
                            onClick={capturePhoto}
                            style={{
                                width: 76, height: 76, borderRadius: '50%',
                                background: '#fff', border: 'none', cursor: 'pointer', padding: 6,
                            }}
                        >
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0297d6' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: ADJUST BARS ───────────────────────────────────────────────── */}
            {step === 'adjust' && capturedImage && (
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', background: '#000', overflow: 'hidden',
                    height: '100dvh',
                }}>
                    {/* Top instruction */}
                    <div style={{
                        width: '100%', maxWidth: 480, display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', flexShrink: 0,
                    }}>
                        <button
                            onClick={() => { setCapturedImage(null); startCamera(); }}
                            style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)', border: 'none',
                                cursor: 'pointer', color: 'white', fontSize: 18,
                            }}
                        >←</button>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>
                                Adjust both lines
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '2px 0 0' }}>
                                🔴 Red = top of head &nbsp;|&nbsp; 🔵 Blue = heels
                            </p>
                        </div>
                        <div style={{ width: 40 }} />
                    </div>

                    {/* Live height preview */}
                    {liveHeight && (
                        <div style={{
                            background: 'rgba(2,151,214,0.9)', color: 'white',
                            fontWeight: 800, fontSize: 18, padding: '6px 20px',
                            borderRadius: 24, marginBottom: 8, flexShrink: 0,
                        }}>
                            {liveHeight}
                        </div>
                    )}

                    {/* Image container */}
                    <div
                        ref={containerRef}
                        style={{
                            position: 'relative',
                            width: '100%', maxWidth: 480,
                            flex: 1,
                            background: '#111', overflow: 'hidden',
                            touchAction: 'none', userSelect: 'none',
                        }}
                    >
                        <img
                            ref={imgRef}
                            src={capturedImage}
                            alt="Captured"
                            onLoad={onImgLoad}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            draggable={false}
                        />

                        {/* ── RED BAR — Head ── */}
                        <div
                            style={{
                                position: 'absolute', left: 0, right: 0,
                                top: barY - 16, height: 32,
                                touchAction: 'none', cursor: 'row-resize', zIndex: 20,
                            }}
                            onMouseDown={onHeadMouseDown}
                            onTouchStart={onHeadTouchStart}
                        >
                            {/* Line */}
                            <div style={{
                                position: 'absolute', left: 0, right: 0, top: 15, height: 2,
                                background: '#ef4444',
                                boxShadow: '0 0 8px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4)',
                            }} />
                            {/* Handle right */}
                            <div style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                width: 40, height: 40, background: '#ef4444', borderRadius: '50%',
                                border: '2px solid white', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            }}>
                                <span style={{ color: 'white', fontSize: 14 }}>↕</span>
                            </div>
                            {/* Label left */}
                            <div style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                background: '#ef4444', color: 'white',
                                fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6,
                            }}>
                                HEAD
                            </div>
                        </div>
                        {/* floorBarY is fixed at h * 0.99 (bottom of image) and used silently in calculateHeight — no visible bar */} 
                    </div>

                    {/* Calculate button */}
                    <div style={{
                        width: '100%', maxWidth: 480,
                        padding: '12px 16px 24px', flexShrink: 0, background: 'rgba(0,0,0,0.8)',
                    }}>
                        <button
                            onClick={calculateHeight}
                            style={{
                                width: '100%', padding: '16px', background: '#0297d6',
                                color: 'white', border: 'none', borderRadius: 14,
                                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            Calculate Height →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: CONFIRM ───────────────────────────────────────────────────── */}
            {step === 'confirm' && (
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    background: '#0f172a', height: '100dvh',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', background: 'rgba(0,0,0,0.4)',
                    }}>
                        <button
                            onClick={() => setStep('adjust')}
                            style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)', border: 'none',
                                cursor: 'pointer', color: 'white', fontSize: 18,
                            }}
                        >←</button>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Height Calculated</span>
                        <button
                            onClick={onClose}
                            style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)', border: 'none',
                                cursor: 'pointer', color: 'white', fontSize: 18,
                            }}
                        >✕</button>
                    </div>

                    {/* Image + result overlay */}
                    {capturedImage && (
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <img
                                src={capturedImage}
                                alt="Captured"
                                style={{
                                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                                    objectFit: 'contain', opacity: 0.5,
                                }}
                            />
                            {/* Result card */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{
                                    background: 'rgba(0,0,0,0.75)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: 28, padding: '36px 48px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    {/* Check icon */}
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                                    }}>
                                        <span style={{ fontSize: 24 }}>✓</span>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 8px' }}>
                                        Measured Height
                                    </p>
                                    <p style={{ color: 'white', fontSize: 44, fontWeight: 900, margin: 0, lineHeight: 1 }}>
                                        {displayHeight(calculatedHeight)}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12 }}>
                                        Camera {CAMERA_HEIGHT_INCHES}"H · Distance {PATIENT_DISTANCE_INCHES}" · FOV {CAMERA_VFOV_DEG}°
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom actions */}
                    <div style={{
                        display: 'flex', gap: 12, padding: '16px 20px 32px',
                        background: 'rgba(0,0,0,0.4)',
                    }}>
                        <button
                            onClick={() => setStep('adjust')}
                            style={{
                                flex: 1, padding: '16px', borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                                color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                            }}
                        >
                            ← Adjust
                        </button>
                        <button
                            onClick={() => { onConfirm(calculatedHeight); onClose(); }}
                            style={{
                                flex: 1, padding: '16px', borderRadius: 14,
                                background: '#22c55e', border: 'none',
                                color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            }}
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





// 'use client';
// import React, { useRef, useState, useCallback, useEffect } from 'react';
// import Webcam from 'react-webcam';

// // ─────────────────────────────────────────────────────────────────────────────
// // PHYSICAL SETUP — adjust these to match your real-world installation
// // ─────────────────────────────────────────────────────────────────────────────
// //
// //  GEOMETRY EXPLAINED:
// //
// //  Camera is mounted at 4 ft, tilted so the floor is visible at
// //  the bottom edge of the frame at the standing mark (6 ft away).
// //
// //  Visible vertical scene height at distance D:
// //    visibleH = 2 × D × tan(FOV/2)
// //
// //  At D = 6 ft, FOV = 60°:
// //    visibleH = 2 × 6 × tan(30°) = 2 × 6 × 0.5774 ≈ 6.93 ft = 83.1 inches
// //
// //  Person's real height:
// //    realHeight = (pixelsFromBarToBottom / totalDisplayPixels) × visibleH
// //
// //  The bottom of the frame = floor level (camera tilted to ensure this).
// //  The red bar = top of person's head.
// //  So height = fraction of frame from head to floor × total visible height.
// //
// // ─────────────────────────────────────────────────────────────────────────────
// const PATIENT_DISTANCE_FT = 6.75;
// const CAMERA_VFOV_DEG = 60;

// const halfFovRad = (CAMERA_VFOV_DEG / 2) * (Math.PI / 180);
// const VISIBLE_HEIGHT_INCHES = 2 * (PATIENT_DISTANCE_FT * 12) * Math.tan(halfFovRad);

// // ── CALIBRATION ──────────────────────────────────────────────────────────────
// // Step 1: Ek banda jo exactly 5ft 8in (68 inches) ka ho, 6ft pe khara karo
// // Step 2: Bar uske sir pe lagao, Calculate karo
// // Step 3: Jo result aaye usse 68 se divide karo → ye tera CALIBRATION_FACTOR hai
// // Step 4: Neeche wali value adjust karo jab tak result 68 inches na aaye
// //
// // Example: app ne 74 inches bataya, actual 68 hai
// // CALIBRATION_FACTOR = 68 / 74 = 0.918
// //
// // Agar app chhota bata raha hai: factor 1 se bada karo (e.g. 1.08)
// // Agar app bada bata raha hai:  factor 1 se chhota karo (e.g. 0.92)
// // ─────────────────────────────────────────────────────────────────────────────
// const CALIBRATION_FACTOR = 0.925; // ← SIRF YE EK NUMBER CHANGE KARO

// // ─────────────────────────────────────────────────────────────────────────────

// interface HeightCameraModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onConfirm: (heightFeetDotInches: string) => void; // e.g. "5.10"
// }

// type Step ='guide' | 'camera' | 'adjust' | 'confirm';

// const HeightCameraModal: React.FC<HeightCameraModalProps> = ({ isOpen, onClose, onConfirm }) => {
//     const videoRef = useRef<HTMLVideoElement>(null);
//     const canvasRef = useRef<HTMLCanvasElement>(null);
//     const streamRef = useRef<MediaStream | null>(null);
//     const imgRef = useRef<HTMLImageElement>(null);
//     const containerRef = useRef<HTMLDivElement>(null);

//     const [step, setStep] = useState<Step>('guide');
//     const [capturedImage, setCapturedImage] = useState<string | null>(null);
//     const [barY, setBarY] = useState<number>(100);
//     const [isDragging, setIsDragging] = useState(false);
//     const [calculatedHeight, setCalculatedHeight] = useState<string>('');
//     const [cameraError, setCameraError] = useState<string>('');
//     const [imgDisplayH, setImgDisplayH] = useState(1);

//     // ── Reset on open/close ──────────────────────────────────────────────────
//     useEffect(() => {
//         if (isOpen) {
//             setStep('guide');
//             setCapturedImage(null);
//             setCalculatedHeight('');
//             setCameraError('');
//         } else {
//             stopCamera();
//         }
//     }, [isOpen]);

//     // ── Lock body scroll when open ───────────────────────────────────────────
//     useEffect(() => {
//         if (isOpen) {
//             document.body.style.overflow = 'hidden';
//         } else {
//             document.body.style.overflow = '';
//         }
//         return () => { document.body.style.overflow = ''; };
//     }, [isOpen]);

//     // ── Camera ───────────────────────────────────────────────────────────────
//     const startCamera = useCallback(async () => {
//         setCameraError('');
//         setStep('camera');
//     }, []);

//     const stopCamera = useCallback(() => {
//         streamRef.current?.getTracks().forEach(t => t.stop());
//         streamRef.current = null;
//     }, []);

//     // ── Capture ──────────────────────────────────────────────────────────────
//     const capturePhoto = useCallback(() => {
//         const video = videoRef.current;
//         const canvas = canvasRef.current;
//         if (!video || !canvas) return;
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         canvas.getContext('2d')!.drawImage(video, 0, 0);
//         const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
//         setCapturedImage(dataUrl);
//         stopCamera();
//         setStep('adjust');
//     }, [stopCamera]);

//     // ── Image load — measure displayed height, init bar near top ────────────
//     const onImgLoad = useCallback(() => {
//         if (!imgRef.current) return;
//         const h = imgRef.current.getBoundingClientRect().height;
//         setImgDisplayH(h);
//         setBarY(h * 0.18); // start near top (head region)
//     }, []);

//     // ── Drag ─────────────────────────────────────────────────────────────────
//     const clamp = (y: number, max: number) => Math.max(0, Math.min(max - 2, y));

//     const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsDragging(true); };
//     const onTouchStart = (e: React.TouchEvent) => { setIsDragging(true); };

//     const onMouseMove = useCallback((e: MouseEvent) => {
//         if (!isDragging || !imgRef.current) return;
//         const rect = imgRef.current.getBoundingClientRect();
//         setBarY(clamp(e.clientY - rect.top, rect.height));
//     }, [isDragging]);

//     const onTouchMove = useCallback((e: TouchEvent) => {
//         if (!isDragging || !imgRef.current) return;
//         e.preventDefault();
//         const rect = imgRef.current.getBoundingClientRect();
//         setBarY(clamp(e.touches[0].clientY - rect.top, rect.height));
//     }, [isDragging]);

//     const onDragEnd = useCallback(() => setIsDragging(false), []);

//     useEffect(() => {
//         window.addEventListener('mousemove', onMouseMove);
//         window.addEventListener('mouseup', onDragEnd);
//         window.addEventListener('touchmove', onTouchMove, { passive: false });
//         window.addEventListener('touchend', onDragEnd);
//         return () => {
//             window.removeEventListener('mousemove', onMouseMove);
//             window.removeEventListener('mouseup', onDragEnd);
//             window.removeEventListener('touchmove', onTouchMove);
//             window.removeEventListener('touchend', onDragEnd);
//         };
//     }, [onMouseMove, onTouchMove, onDragEnd]);

//     // ── Height calculation ───────────────────────────────────────────────────
//     //
//     //  realHeight (inches) = (pixelsFromBarToBottom / totalDisplayPixels) × VISIBLE_HEIGHT_INCHES
//     //
//     //  pixelsFromBarToBottom = displayH - barY
//     //  (because barY is measured from the top of the image,
//     //   and the bottom of the image = floor level)
//     //
//     const calculateHeight = useCallback(() => {
//         if (!imgRef.current) return;
//         const displayH = imgRef.current.getBoundingClientRect().height;
//         if (!displayH) return;

//         const pixelsFromHeadToFloor = displayH - barY;
//         const heightInches = Math.round((pixelsFromHeadToFloor / displayH) * VISIBLE_HEIGHT_INCHES * CALIBRATION_FACTOR);

//         const feet = Math.floor(heightInches / 12);
//         const inches = heightInches % 12;
//         setCalculatedHeight(`${feet}.${inches}`);
//         setStep('confirm');
//     }, [barY]);

//     // ── Display helper ───────────────────────────────────────────────────────
//     const displayHeight = (val: string) => {
//         if (!val) return '—';
//         const [f, i] = val.split('.');
//         return `${f} ft ${i ?? 0} in`;
//     };

//     if (!isOpen) return null;

//     // ── FULLSCREEN WRAPPER ────────────────────────────────────────────────────
//     return (
//         <div
//             style={{
//                 position: 'fixed',
//                 inset: 0,
//                 zIndex: 9999,
//                 background: '#000',
//                 display: 'flex',
//                 flexDirection: 'column',
//                 width: '100vw',
//                 height: '100dvh',
//                 touchAction: 'none',
//             }}
//         >

//             {/* ── STEP: GUIDE ── */}
//             {step === 'guide' && (
//                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: '#fff', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
//                     {/* Header */}
//                     <div style={{ width: '100%', padding: '16px 20px', background: '#0297d6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
//                         <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>←</button>
//                         <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Height Measurement</span>
//                         <div style={{ width: 24 }} />
//                     </div>

//                     {/* Instruction text */}
//                     <div style={{ textAlign: 'center', padding: '20px 24px 8px' }}>
//                         <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
//                             Please <span style={{ color: '#0297d6' }}>hold still</span> while standing six feet from the kiosk.
//                         </p>
//                         <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginTop: 6 }}>
//                             TAP <span style={{ color: '#0297d6' }}>"Measure Height"</span> to open camera
//                         </p>
//                     </div>

//                     {/* Person + ruler illustration */}
//                     <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', maxWidth: 400 }}>
//                         {/* Ruler on left */}
//                         <div style={{ position: 'absolute', left: 40, top: '5%', bottom: '5%', width: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
//                             {[150,140,130,120,110,100,90,80,70,60,50,40,30,20,10].map(n => (
//                                 <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                                     <div style={{ width: n % 50 === 0 ? 20 : 12, height: 1, background: '#475569' }} />
//                                     <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{n}</span>
//                                 </div>
//                             ))}
//                         </div>

//                         {/* Person silhouette */}
//                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 40 }}>
//                             {/* Head */}
//                             <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#7c5c44', marginBottom: 4, border: '3px solid #0297d6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                 <div style={{ fontSize: 24 }}>👤</div>
//                             </div>
//                             {/* Body */}
//                             <div style={{ width: 80, height: 120, background: '#1e293b', borderRadius: 8 }} />
//                             {/* Legs */}
//                             <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
//                                 <div style={{ width: 32, height: 100, background: '#d4a574', borderRadius: 4 }} />
//                                 <div style={{ width: 32, height: 100, background: '#d4a574', borderRadius: 4 }} />
//                             </div>
//                             {/* Feet */}
//                             <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
//                                 <div style={{ width: 40, height: 16, background: '#374151', borderRadius: 8 }} />
//                                 <div style={{ width: 40, height: 16, background: '#374151', borderRadius: 8 }} />
//                             </div>
//                         </div>

//                         {/* Blue stand bars */}
//                         <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 8, background: '#1d4ed8', borderRadius: 4 }} />
//                         <div style={{ position: 'absolute', right: '15%', top: 0, bottom: 0, width: 8, background: '#1d4ed8', borderRadius: 4 }} />
//                     </div>

//                     {/* Bottom button */}
//                     <div style={{ width: '100%', padding: '16px', flexShrink: 0 }}>
//                         <button
//                             onClick={startCamera}
//                             style={{ width: '100%', padding: '18px', background: '#0297d6', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
//                         >
//                             Measure Height
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* ── STEP: CAMERA ── */}
//             {step === 'camera' && (
//                 <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#000', zIndex: 99999 }}>
//                     <canvas ref={canvasRef} style={{ display: 'none' }} />

//                     {/* Top bar with back button */}
//                     <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
//                         <button
//                             onClick={() => { stopCamera(); setStep('guide'); }}
//                             style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}
//                         >
//                             ←
//                         </button>
//                         <span style={{ color: 'white', fontSize: 13, fontWeight: 600, marginLeft: 12 }}>Full body must be in frame</span>
//                     </div>

//                     {/* Webcam fills entire screen */}
//                     <Webcam
//                         ref={videoRef as any}
//                         audio={false}
//                         screenshotFormat="image/jpeg"
//                         videoConstraints={{ facingMode: 'user' }}
//                         style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
//                     />

//                     {/* Bottom capture button — overlaid on video */}
//                     <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
//                         <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 16px' }}>Floor visible at bottom · Stand 6 ft away</p>
//                         <button
//                             onClick={() => {
//                                 const imageSrc = (videoRef.current as any).getScreenshot();
//                                 setCapturedImage(imageSrc);
//                                 stopCamera();
//                                 setStep('adjust');
//                             }}
//                             style={{ width: 76, height: 76, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', padding: 6 }}
//                         >
//                             <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0297d6' }} />
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* ── STEP: ADJUST BAR ── */}
//             {step === 'adjust' && capturedImage && (
//                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000', padding: '16px', overflow: 'auto' }}>
//                     {/* Top instruction bar */}
//                     <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
//                         <button
//                             onClick={() => { setCapturedImage(null); startCamera(); }}
//                             className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
//                         >
//                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//                             </svg>
//                         </button>
//                         <div className="text-center">
//                             <p className="text-white font-bold text-sm">Drag to top of head</p>
//                             <p className="text-white/50 text-xs">Red line = crown of head</p>
//                         </div>
//                         <div className="w-10" />
//                     </div>

//                     {/* Image — fixed aspect ratio, same as working app */}
//                     <div
//                         ref={containerRef}
//                         style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '3/4', background: '#111', borderRadius: 24, overflow: 'hidden', touchAction: 'none', userSelect: 'none' }}
//                     >
//                         <img
//                             ref={imgRef}
//                             src={capturedImage}
//                             alt="Captured"
//                             onLoad={onImgLoad}
//                             className="w-full h-full object-cover"
//                             draggable={false}
//                         />

//                         {/* Floor indicator — bottom of image */}
//                         <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400/70 z-10" />
//                         <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full z-10">
//                             ↓ Floor Level
//                         </div>

//                         {/* Red draggable bar */}
//                         <div
//                             className="absolute left-0 right-0 z-20 cursor-row-resize"
//                             style={{ top: barY - 16, height: 32, touchAction: 'none' }}
//                             onMouseDown={onMouseDown}
//                             onTouchStart={onTouchStart}
//                         >
//                             {/* Line */}
//                             <div
//                                 className="absolute left-0 right-0"
//                                 style={{
//                                     top: 15,
//                                     height: 2,
//                                     background: '#ef4444',
//                                     boxShadow: '0 0 8px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4)',
//                                 }}
//                             />
//                             {/* Drag handle — RIGHT side */}
//                             <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
//                                 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                                     <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
//                                 </svg>
//                             </div>
//                             {/* Left label */}
//                             <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded">
//                                 HEAD
//                             </div>
//                         </div>
//                     </div>

//                     {/* Bottom calculate button */}
//                     <div className="shrink-0 px-5 pb-8 pt-4 bg-black/80 backdrop-blur-sm">
//                         <button
//                             onClick={calculateHeight}
//                             className="w-full py-4 rounded-2xl bg-[#0297d6] hover:bg-[#0286c2] text-white font-bold text-base transition-colors"
//                         >
//                             Calculate Height →
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* ── STEP: CONFIRM ── */}
//             {step === 'confirm' && (
//                 <div className="flex-1 flex flex-col bg-slate-900">
//                     {/* Header */}
//                     <div className="flex items-center justify-between px-5 py-4 bg-black/40 backdrop-blur-sm">
//                         <button
//                             onClick={() => setStep('adjust')}
//                             className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
//                         >
//                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//                             </svg>
//                         </button>
//                         <span className="text-white font-bold">Height Calculated</span>
//                         <button
//                             onClick={onClose}
//                             className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
//                         >
//                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                         </button>
//                     </div>

//                     {/* Preview image — fills most of screen */}
//                     {capturedImage && (
//                         <div className="flex-1 relative overflow-hidden">
//                             <img
//                                 src={capturedImage}
//                                 alt="Captured"
//                                 className="absolute inset-0 w-full h-full object-contain opacity-60"
//                             />
//                             {/* Height result overlay */}
//                             <div className="absolute inset-0 flex flex-col items-center justify-center">
//                                 <div className="bg-black/70 backdrop-blur-md rounded-3xl px-10 py-8 flex flex-col items-center border border-white/10">
//                                     <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
//                                         <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                                         </svg>
//                                     </div>
//                                     <p className="text-white/60 text-sm mb-1">Measured Height</p>
//                                     <p className="text-5xl font-black text-white mb-1">{displayHeight(calculatedHeight)}</p>
//                                     <p className="text-white/40 text-xs mt-2">
//                                         Camera 4 ft · Distance 6 ft · FOV {CAMERA_VFOV_DEG}°
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Bottom actions */}
//                     <div className="shrink-0 px-5 pb-8 pt-4 bg-black/40 backdrop-blur-sm flex gap-3">
//                         <button
//                             onClick={() => setStep('adjust')}
//                             className="flex-1 py-4 rounded-2xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
//                         >
//                             ← Adjust
//                         </button>
//                         <button
//                             onClick={() => { onConfirm(calculatedHeight); onClose(); }}
//                             className="flex-1 py-4 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-lg shadow-green-500/30"
//                         >
//                             Use This Height ✓
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default HeightCameraModal;