'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Printer, X, Loader2 } from 'lucide-react'
import { BluetoothPrinterModal } from '@/app/dashboard/consultation/components/BluetoothPrinterModel'
import { apiService } from '@/app/_utils/apiService'
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge'

interface VitalReportModalProps {
    isOpen: boolean
    onClose: () => void
    vitalsId: string | null   // <-- ADD THIS
}

// Helper: filter out empty/placeholder values
const shouldShow = (value: any): boolean => {
    if (value == null) return false
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '') return false
        const lower = trimmed.toLowerCase()
        if (lower === 'not performed' || lower === 'unknown') return false
    }
    return true
}

const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#555', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontWeight: 800, color: '#111' }}>{value}</span>
    </div>
)

const SectionTitle = ({ title }: { title: string }) => (
    <div style={{
        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
        color: '#0297d6', borderBottom: '1px solid #0297d6', paddingBottom: 3, marginBottom: 6, marginTop: 10
    }}>
        {title}
    </div>
)

const VitalReportModal: React.FC<VitalReportModalProps> = ({ isOpen, onClose, vitalsId }) => {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPrinting, setIsPrinting] = useState(false)
    const [isBTModalOpen, setIsBTModalOpen] = useState(false)

    // Fetch full report when modal opens and vitalsId exists
    useEffect(() => {
        if (!isOpen || !vitalsId) return
        setLoading(true)
        setError(null)
        apiService.getFullReport(vitalsId)
            .then(res => {
                if (res.success) setReport(res.data)
                else setError(res.error || 'Failed to load report')
            })
            .catch(err => setError(err.message || 'Network error'))
            .finally(() => setLoading(false))
    }, [isOpen, vitalsId])

    // Helper to format height (assumes stored as "feet.inches")
    const formatHeight = (h: string) => {
        if (!h) return '—'
        const parts = h.split('.')
        return parts.length === 2 ? `${parts[0]}ft ${parts[1]}in` : `${h} ft`
    }

    // Build thermal print payload from fetched report
    const buildPrintPayload = useCallback(() => {
        if (!report) return null
        const { patient, vitals, rapidTesting, eyeTesting, colorBlindTesting, hearingTesting } = report
        const sections: string[] = []

        // Vitals section
        const vitalsLines: string[] = []
        if (vitals.Systolic && vitals.Diastolic) vitalsLines.push(`BP: ${vitals.Systolic}/${vitals.Diastolic} mmHg`)
        if (shouldShow(vitals.BloodOxygen)) vitalsLines.push(`SpO2: ${vitals.BloodOxygen}%`)
        if (shouldShow(vitals.PulseRate)) vitalsLines.push(`Pulse: ${vitals.PulseRate} bpm`)
        if (shouldShow(vitals.Temperature)) vitalsLines.push(`Temp: ${vitals.Temperature}°C`)
        if (shouldShow(vitals.Weight)) vitalsLines.push(`Weight: ${vitals.Weight} kg`)
        if (shouldShow(vitals.Height)) vitalsLines.push(`Height: ${formatHeight(vitals.Height)}`)
        if (shouldShow(vitals.bmi)) vitalsLines.push(`BMI: ${vitals.bmi}`)
        if (vitalsLines.length) sections.push('--- VITALS ---\n' + vitalsLines.join('\n'))

        // Rapid Testing fields appended to vitals section (no separate heading)
        if (rapidTesting) {
            const unitMap: Record<string, string> = {
                bloodSugar: 'mg/dL',
                cholesterol: 'mg/dL',
                bodyFat: '%',
                hemoglobin: 'g/dL',
            }
            const allRapidFields = ['bloodSugar', 'ecg', 'hiv', 'hepatitis', 'hbsag', 'hcvAb', 'hivAb', 'dengueNs1Ag', 'syphilisAb', 'typhoidAb', 'tuberculosis', 'malariaPfPvAg', 'hemoglobin', 'cholesterol', 'bodyFat']
            allRapidFields.forEach(field => {
                if (!shouldShow(rapidTesting[field])) return
                const raw = rapidTesting[field]
                const val = typeof raw === 'string' && raw.toLowerCase() === 'consultation required' ? 'Consult Req' : raw
                const unit = unitMap[field] ? ` ${unitMap[field]}` : ''
                const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
                vitalsLines.push(`${label}: ${val}${unit}`)
            })
        }

        //  Eye Testing
        if (eyeTesting && (shouldShow(eyeTesting.leftEye) || shouldShow(eyeTesting.rightEye))) {
            const eyeLines: string[] = []
            if (shouldShow(eyeTesting.chartType)) eyeLines.push(`Chart: ${eyeTesting.chartType}`)
            if (shouldShow(eyeTesting.leftEye)) eyeLines.push(`Left Eye: ${eyeTesting.leftEye}`)
            if (shouldShow(eyeTesting.rightEye)) eyeLines.push(`Right Eye: ${eyeTesting.rightEye}`)
            if (eyeLines.length) sections.push('--- EYE TESTING ---\n' + eyeLines.join('\n'))
        }

        // Color Blind Test
        if (colorBlindTesting && shouldShow(colorBlindTesting.colorBlindResult)) {
            sections.push(`--- COLOR BLIND TEST ---\nResult: ${colorBlindTesting.colorBlindResult}`)
        }

        // Hearing Test
        if (hearingTesting && (shouldShow(hearingTesting.leftEarResult) || shouldShow(hearingTesting.rightEarResult))) {
            const hearingLines: string[] = []
            if (shouldShow(hearingTesting.leftEarResult)) hearingLines.push(`Left Ear: ${hearingTesting.leftEarResult}`)
            if (shouldShow(hearingTesting.rightEarResult)) hearingLines.push(`Right Ear: ${hearingTesting.rightEarResult}`)
            if (hearingLines.length) sections.push('--- HEARING TEST ---\n' + hearingLines.join('\n'))
        }

        // After the Hearing Test block, before the return
        if (report.vitals?.symptoms && shouldShow(report.vitals.symptoms)) {
            const symptomText = typeof report.vitals.symptoms === 'string'
                ? report.vitals.symptoms
                : report.vitals.symptoms.join(', ')
            sections.push(`--- SYMPTOMS ---\n${symptomText}`)
        }

        return {
            clinicName: 'EZShifa Digital Health',
            date: new Date().toLocaleDateString(),
            token: patient.token || 'N/A',
            patient: {
                name: `${patient.firstName} ${patient.lastName}`,
                ageSex: `${patient.age ?? ''}Y / ${patient.gender ?? ''}`,
                phone: patient.phone,
            },
            reportSections: sections,
        }
    }, [report])

    const handleWebPrint = () => {
        const el = document.getElementById('vital-report-paper')
        if (!el) return
        const win = window.open('', '_blank', 'width=420,height=900')
        if (!win) return
        win.document.write(`
      <html><head><title>Vital Report</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:monospace;background:#fff;color:#111;padding:24px;width:340px;margin:0 auto}
        img{display:block;margin:0 auto 6px;height:44px}
        .sec{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#0297d6;border-bottom:1px solid #0297d6;padding-bottom:2px;margin:10px 0 6px}
        .row{display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px}
        .lbl{font-weight:700;text-transform:uppercase;color:#555;letter-spacing:.5px}
        .val{font-weight:800;color:#111}
        .foot{text-align:center;font-size:8px;text-transform:uppercase;letter-spacing:2px;opacity:.4;margin-top:16px}
      </style></head><body>
      ${el.innerHTML}
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `)
        win.document.close()
    }

    const handlePrintClick = () => {
        console.log("1. handlePrintClick fired")
        console.log("2. AndroidNative exists?", !!(window as any).AndroidNative)

        if ((window as any).AndroidNative) {
            console.log("3. Opening BT modal")
            setIsBTModalOpen(true)
        } else {
            console.log("3. No AndroidNative, doing web print")
            handleWebPrint()
        }
    }

    const executeThermalPrint = useCallback(() => {
        console.log("4. executeThermalPrint fired")
        console.log("5. payload:", buildPrintPayload())

        setIsPrinting(true)
        setTimeout(() => {
            try {
                const payload = buildPrintPayload()
                console.log(payload)
                console.log("6. AndroidBridge.printVitalReport exists?", typeof AndroidBridge.printVitalReport)

                if (payload) {
                    AndroidBridge.printVitalReport(payload)
                    console.log("7. printVitalReport called")
                } else {
                    console.log("7. payload was null!")
                    alert('No data to print')
                }
            } catch (err) {
                console.error('[VitalReport] Thermal print error:', err)
                alert('Failed to prepare report for printing.')
            } finally {
                setIsPrinting(false)
            }
        }, 150)
    }, [buildPrintPayload])

    if (!isOpen) return null

    console.log(report)

    return (
        <>

            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="font-black text-slate-800 text-base uppercase tracking-widest">Vital Report Preview</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                    </div>

                    <div className="overflow-y-auto flex-1 bg-slate-50 p-4">
                        {loading && (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="animate-spin text-[#0297d6] mr-2" size={24} /> Loading report...
                            </div>
                        )}
                        {error && (
                            <div className="text-red-500 text-center py-4">Error: {error}</div>
                        )}
                        {!loading && !error && report && (
                            <div id="vital-report-paper" className="bg-white border border-slate-200 rounded-2xl shadow-sm mx-auto" style={{ fontFamily: 'monospace', width: 300, padding: 16 }}>
                                {/* Logo & header */}
                                <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 10 }}>
                                    <img src="/logo2.png" alt="EZShifa" style={{ height: 44, margin: '0 auto 4px' }} />
                                    <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Vital Report</div>
                                    <div style={{ fontSize: 10, fontWeight: 700 }}>EZShifa Digital Health</div>
                                </div>

                                {/* Patient info */}
                                <div style={{ borderBottom: '1px dashed #bbb', paddingBottom: 8, marginBottom: 4 }}>
                                    <Row label="Name" value={`${report.patient.firstName} ${report.patient.lastName}`} />
                                    <Row label="Phone" value={report.patient.phone} />
                                    {report.patient.age && <Row label="Age" value={`${report.patient.age} yrs`} />}
                                    {report.patient.gender && <Row label="Gender" value={report.patient.gender} />}
                                    {report.patient.token && <Row label="Token" value={`#${report.patient.token}`} />}
                                    <Row label="Date" value={new Date().toLocaleDateString()} />
                                </div>

                                {/* Vitals + Rapid Testing merged */}
                                {(() => {
                                    const v = report.vitals
                                    const rt = report.rapidTesting
                                    const unitMap: Record<string, string> = {
                                        bloodSugar: 'mg/dL',
                                        cholesterol: 'mg/dL',
                                        bodyFat: '%',
                                        hemoglobin: 'g/dL',
                                    }
                                    const rapidFields = ['bloodSugar', 'ecg', 'hiv', 'hepatitis', 'hbsag', 'hcvAb', 'hivAb', 'dengueNs1Ag', 'syphilisAb', 'typhoidAb', 'tuberculosis', 'malariaPfPvAg', 'hemoglobin', 'cholesterol', 'bodyFat']
                                    const hasVitals = shouldShow(v.PulseRate) || shouldShow(v.BloodOxygen) || shouldShow(v.Systolic) || shouldShow(v.Temperature) || shouldShow(v.Weight) || shouldShow(v.Height)
                                    const hasRapid = rt && rapidFields.some(f => shouldShow(rt[f]))
                                    if (!hasVitals && !hasRapid) return null
                                    return (
                                        <>
                                            <SectionTitle title="Vitals" />
                                            {shouldShow(v.Systolic) && shouldShow(v.Diastolic) && <Row label="Blood Pressure" value={`${v.Systolic}/${v.Diastolic} mmHg`} />}
                                            {shouldShow(v.BloodOxygen) && <Row label="SpO2" value={`${v.BloodOxygen}%`} />}
                                            {shouldShow(v.PulseRate) && <Row label="Pulse Rate" value={`${v.PulseRate} bpm`} />}
                                            {shouldShow(v.Temperature) && <Row label="Temperature" value={`${v.Temperature}°C`} />}
                                            {shouldShow(v.Weight) && <Row label="Weight" value={`${v.Weight} kg`} />}
                                            {shouldShow(v.Height) && <Row label="Height" value={formatHeight(v.Height)} />}
                                            {shouldShow(v.bmi) && <Row label="BMI" value={v.bmi} />}
                                            {rt && rapidFields.map(f => {
                                                if (!shouldShow(rt[f])) return null
                                                const rawVal = rt[f]
                                                const shortened = typeof rawVal === 'string' && rawVal.toLowerCase() === 'consultation required' ? 'Consult Req' : rawVal
                                                const unit = unitMap[f] ? ` ${unitMap[f]}` : ''
                                                const label = f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                                                return <Row key={f} label={label} value={`${shortened}${unit}`} />
                                            })}
                                        </>
                                    )
                                })()}
                                {/* Eye Testing */}
                                {report.eyeTesting && (() => {
                                    const et = report.eyeTesting
                                    const hasAny = shouldShow(et.leftEye) || shouldShow(et.rightEye)
                                    if (!hasAny) return null
                                    return (
                                        <>
                                            <SectionTitle title="Eye Screening" />
                                            {shouldShow(et.chartType) && <Row label="Chart Type" value={et.chartType} />}
                                            {shouldShow(et.leftEye) && <Row label="Left Eye" value={et.leftEye} />}
                                            {shouldShow(et.rightEye) && <Row label="Right Eye" value={et.rightEye} />}
                                        </>
                                    )
                                })()}

                                {/* Color Blind Test */}
                                {report.colorBlindTesting && shouldShow(report.colorBlindTesting.colorBlindResult) && (
                                    <>
                                        <SectionTitle title="Color Blind Screening" />
                                        <Row label="Result" value={report.colorBlindTesting.colorBlindResult} />
                                    </>
                                )}

                                {/* Hearing Test */}
                                {report.hearingTesting && (() => {
                                    const ht = report.hearingTesting
                                    const hasAny = shouldShow(ht.leftEarResult) || shouldShow(ht.rightEarResult)
                                    if (!hasAny) return null
                                    return (
                                        <>
                                            <SectionTitle title="Hearing Screening" />
                                            {shouldShow(ht.leftEarResult) && <Row label="Left Ear" value={ht.leftEarResult} />}
                                            {shouldShow(ht.rightEarResult) && <Row label="Right Ear" value={ht.rightEarResult} />}
                                        </>
                                    )
                                })()}

                                {/* Symptoms */}
                                {report.vitals.symptoms && shouldShow(report.vitals.symptoms) && (
                                    <>
                                        <SectionTitle title="Symptoms" />
                                        <div style={{ fontSize: 11, color: '#333', lineHeight: 1.6 }}>
                                            {typeof report.vitals.symptoms === 'string' ? report.vitals.symptoms : report.vitals.symptoms.join(', ')}
                                        </div>
                                    </>
                                )}
                                <div className="foot" style={{ marginTop: 16, textAlign: 'center', fontSize: 8, letterSpacing: 2, opacity: 1 }}>
                                    This Digital Prescription from EZShifa as seen by the doctor does not require stamp or signature
                                    and is not valid for court.
                                </div>
                                <div className="foot" style={{ marginTop: 16, textAlign: 'center', fontSize: 8, letterSpacing: 2, opacity: 1 }}>
                                    This prescription is based on visual consultation (VOC) offered by EZShifa.
                                </div>
                                <div className="foot" style={{ marginTop: 16, textAlign: 'center', fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.4 }}>
                                    *** End of Vital Report ***
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100">
                        <button
                            onClick={handlePrintClick}
                            disabled={loading || !report}
                            className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all
                ${(loading || !report) ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-slate-900 hover:bg-[#0297d6] text-white active:scale-95'}`}
                        >
                            {isPrinting ? <><Loader2 size={15} className="animate-spin" />Processing...</> : <><Printer size={15} />Print Vital Report</>}
                        </button>
                    </div>
                </div>
            </div>

            <BluetoothPrinterModal
                isOpen={isBTModalOpen}
                onClose={() => { if (!isPrinting) setIsBTModalOpen(false) }}
                onPrint={executeThermalPrint}
                isPrinting={isPrinting}
            />

        </>
    )
}

export default VitalReportModal