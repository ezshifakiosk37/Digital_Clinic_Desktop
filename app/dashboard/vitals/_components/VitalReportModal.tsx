'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { Printer, X, Loader2, ChevronDown, Mail, FileDown } from 'lucide-react'
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
const shortenResult = (value: any): string => {
    if (
        typeof value === 'string' &&
        value.trim().toLowerCase() === 'consultation required'
    ) {
        return 'Consult Req'
    }
    return value
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
    const [showActionDropdown, setShowActionDropdown] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [isSavingPdf, setIsSavingPdf] = useState(false)
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'sent' | 'error'>('idle')
    const [patientEmail, setPatientEmail] = useState<string | null>(null)
    const [showEmailConfirm, setShowEmailConfirm] = useState(false)
    const [isEditingEmail, setIsEditingEmail] = useState(false)
    const [editedEmail, setEditedEmail] = useState('')
    const [noEmailInput, setNoEmailInput] = useState('')
    const [isSavingEmail, setIsSavingEmail] = useState(false)

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
    const formatHeight = (h: string, unit?: string) => {
        if (!h) return '—';
        // DB always stores cm now
        if (unit === 'cm') return `${parseFloat(h).toFixed(0)} cm`;
        // Convert cm → feet.inches for display
        const totalInches = parseFloat(h) / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        return `${ft}ft ${inch}in`;
    };

    // Build thermal print payload from fetched report
    const buildPrintPayload = useCallback(() => {
        if (!report) return null;
        const { patient, vitals, rapidTesting, eyeTesting, colorBlindTesting, hearingTesting } = report;
        const sections: string[] = [];

        // --- COMBINED VITALS + RAPID TESTING (single section) ---
        const combinedVitalsLines: string[] = [];

        // 1. Standard vitals
        if (vitals.Systolic && vitals.Diastolic) combinedVitalsLines.push(`BP: ${vitals.Systolic}/${vitals.Diastolic} mmHg`);
        if (shouldShow(vitals.BloodOxygen)) combinedVitalsLines.push(`SpO2: ${vitals.BloodOxygen}%`);
        if (shouldShow(vitals.PulseRate)) combinedVitalsLines.push(`Pulse: ${vitals.PulseRate} bpm`);
        if (shouldShow(vitals.Temperature)) {
            const t = parseFloat(vitals.Temperature);
            const tempDisplay = isNaN(t)
                ? vitals.Temperature
                : vitals.temperatureUnit === '°F'
                    ? `${((t * 9 / 5) + 32).toFixed(1)}°F`
                    : `${t.toFixed(1)}°C`;
            combinedVitalsLines.push(`Temp: ${tempDisplay}`);
        }
        if (shouldShow(vitals.Weight)) combinedVitalsLines.push(`Weight: ${vitals.Weight} kg`);
        if (shouldShow(vitals.Height)) combinedVitalsLines.push(`Height: ${formatHeight(vitals.Height, vitals.heightUnit)}`);
        if (shouldShow(vitals.bmi)) combinedVitalsLines.push(`BMI: ${vitals.bmi}`);

        // 2. Rapid testing fields (merged into the same list)
        if (rapidTesting) {
            const unitMap: Record<string, string> = {
                bloodSugar: 'mg/dL',
                cholesterol: 'mg/dL',
                bodyFat: '%',
                hemoglobin: 'g/dL',
            };
            const allRapidFields = [
                'bloodSugar', 'ecg', 'hiv', 'hepatitis', 'hbsag', 'hcvAb', 'hivAb',
                'dengueNs1Ag', 'syphilisAb', 'typhoidAb', 'tuberculosis', 'malariaPfPvAg',
                'hemoglobin', 'cholesterol', 'bodyFat'
            ];
            allRapidFields.forEach(field => {
                if (!shouldShow(rapidTesting[field])) return;
                const raw = rapidTesting[field];
                const val = shortenResult(raw);
                const unit = unitMap[field] ? ` ${unitMap[field]}` : '';
                const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                combinedVitalsLines.push(`${label}: ${val}${unit}`);
            });
        }

        // 3. Push a single VITALS section if there is any data
        if (combinedVitalsLines.length) {
            sections.push('--- VITALS ---\n' + combinedVitalsLines.join('\n'));
        }

        // --- EYE TESTING (unchanged) ---
        if (eyeTesting && (shouldShow(eyeTesting.leftEyeResult) || shouldShow(eyeTesting.rightEyeResult))) {
            const eyeLines: string[] = [];
            if (shouldShow(eyeTesting.chartType)) eyeLines.push(`Chart: ${eyeTesting.chartType}`);
            if (shouldShow(eyeTesting.leftEyeResult)) eyeLines.push(`Left Eye: ${shortenResult(eyeTesting.leftEyeResult)}`);
            if (shouldShow(eyeTesting.rightEyeResult)) eyeLines.push(`Right Eye: ${shortenResult(eyeTesting.rightEyeResult)}`);
            if (eyeLines.length) sections.push('--- EYE SCREENING ---\n' + eyeLines.join('\n'));
        }

        // --- COLOR BLIND TEST -
        if (colorBlindTesting && shouldShow(colorBlindTesting.colorBlindResult)) {
            sections.push(`--- COLOR BLIND SCREENING ---\nResult: ${shortenResult(colorBlindTesting.colorBlindResult)}`);
        }

        // --- HEARING TEST ---
        if (hearingTesting && (shouldShow(hearingTesting.leftEarResult) || shouldShow(hearingTesting.rightEarResult))) {
            const hearingLines: string[] = [];
            if (shouldShow(hearingTesting.leftEarResult)) hearingLines.push(`Left Ear: ${shortenResult(hearingTesting.leftEarResult)}`);
            if (shouldShow(hearingTesting.rightEarResult)) hearingLines.push(`Right Ear: ${shortenResult(hearingTesting.rightEarResult)}`);
            if (hearingLines.length) sections.push('--- HEARING SCREENING ---\n' + hearingLines.join('\n'));
        }

        // --- SYMPTOMS ---
        if (report.vitals?.symptoms && shouldShow(report.vitals.symptoms)) {
            const symptomText = typeof report.vitals.symptoms === 'string'
                ? report.vitals.symptoms
                : report.vitals.symptoms.join(', ');
            sections.push(`--- SYMPTOMS ---\n${symptomText}`);
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
        };
    }, [report]);

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

    const handleSendEmail = async () => {
        setShowActionDropdown(false)
        setEmailStatus('checking')
        setIsEditingEmail(false)
        setNoEmailInput('')
        try {
            const res = await apiService.getPatientEmail(report?.patient?.id)
            if (res.success && res.email) {
                setPatientEmail(res.email)
                setEditedEmail(res.email)
                setEmailStatus('found')
                setShowEmailConfirm(true)
            } else {
                setPatientEmail(null)
                setEditedEmail('')
                setEmailStatus('not_found')
                setShowEmailConfirm(true)
            }
        } catch {
            setEmailStatus('error')
            setTimeout(() => setEmailStatus('idle'), 3000)
        }
    }

    const handleSaveEmail = async (emailToSave: string) => {
        if (!emailToSave.trim() || !report?.patient?.id) return
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSave.trim())) {
            alert('Please enter a valid email address.')
            return
        }
        setIsSavingEmail(true)
        try {
            await apiService.updatePatientEmail(report.patient.id, emailToSave.trim())
            setPatientEmail(emailToSave.trim())
            setEditedEmail(emailToSave.trim())
            setIsEditingEmail(false)
            setEmailStatus('found')
        } catch {
            alert('Failed to save email')
        } finally {
            setIsSavingEmail(false)
        }
    }

    const generatePdfBlob = async (): Promise<Blob | null> => {
        const el = document.getElementById('vital-report-paper')
        if (!el) return null
        try {
            const { default: jsPDF } = await import('jspdf')
            const iframe = document.createElement('iframe')
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:340px;height:auto;border:none;'
            document.body.appendChild(iframe)
            const iframeDoc = iframe.contentDocument!
            iframeDoc.open()
            iframeDoc.write(`<html><head><style>
                *{margin:0;padding:0;box-sizing:border-box;font-family:monospace}
                body{background:#fff;color:#111;width:340px;padding:16px}
                img{display:block;margin:0 auto 4px;height:44px}
            </style></head><body>${el.innerHTML}</body></html>`)
            iframeDoc.close()
            await new Promise(r => setTimeout(r, 300))
            const { default: html2canvas } = await import('html2canvas')
            const canvas = await html2canvas(iframeDoc.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 340 })
            document.body.removeChild(iframe)
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
            return pdf.output('blob')
        } catch (err) {
            console.error('PDF generation error:', err)
            return null
        }
    }

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

    const handleConfirmSendEmail = async () => {
        const emailToUse = isEditingEmail ? editedEmail : patientEmail
        if (!emailToUse || !vitalsId) return
        if (!isValidEmail(emailToUse)) {
            alert('Please enter a valid email address.')
            return
        }
        setIsSendingEmail(true)
        try {
            const pdfBlob = await generatePdfBlob()
            if (!pdfBlob) throw new Error('Failed to generate PDF')

            const firstName = report.patient.firstName?.trim() || 'Patient'
            const lastName = report.patient.lastName?.trim() || ''
            const fileName = `${firstName}_${lastName}.pdf`

            const formData = new FormData()
            formData.append('pdf', pdfBlob, fileName)
            formData.append('email', emailToUse)
            formData.append('patientName', `${firstName} ${lastName}`)
            formData.append('token', report.patient.token || '')

            const res = await apiService.sendVitalReportEmailPdf(vitalsId, formData)
            if (res.success) {
                setEmailStatus('sent')
                setShowEmailConfirm(false)
                setTimeout(() => setEmailStatus('idle'), 3000)
            } else {
                setEmailStatus('error')
                setTimeout(() => setEmailStatus('idle'), 3000)
            }
        } catch {
            setEmailStatus('error')
            setTimeout(() => setEmailStatus('idle'), 3000)
        } finally {
            setIsSendingEmail(false)
        }
    }

    const handleSaveAsPdf = async () => {
        setShowActionDropdown(false)
        const el = document.getElementById('vital-report-paper')
        if (!el || !report) return

        setIsSavingPdf(true)
        try {
            const { default: jsPDF } = await import('jspdf')

            // Clone into an isolated iframe to avoid oklch/Tailwind CSS conflicts
            const iframe = document.createElement('iframe')
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:340px;height:auto;border:none;'
            document.body.appendChild(iframe)

            const iframeDoc = iframe.contentDocument!
            iframeDoc.open()
            iframeDoc.write(`
                <html><head><style>
                    *{margin:0;padding:0;box-sizing:border-box;font-family:monospace}
                    body{background:#fff;color:#111;width:340px;padding:16px}
                    img{display:block;margin:0 auto 4px;height:44px}
                </style></head><body>${el.innerHTML}</body></html>
            `)
            iframeDoc.close()

            await new Promise(r => setTimeout(r, 300))

            const { default: html2canvas } = await import('html2canvas')
            const canvas = await html2canvas(iframeDoc.body, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 340,
            })

            document.body.removeChild(iframe)

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)

            const firstName = report.patient.firstName?.trim() || 'Patient'
            const lastName = report.patient.lastName?.trim() || ''
            pdf.save(`${firstName}_${lastName}.pdf`)
        } catch (err) {
            console.error('PDF save error:', err)
            alert('Failed to save PDF')
        } finally {
            setIsSavingPdf(false)
        }
    }

    if (!isOpen) return null

    // console.log(report)

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
                                            {shouldShow(v.Temperature) && (
                                                <Row
                                                    label="Temperature"
                                                    value={(() => {
                                                        const t = parseFloat(v.Temperature);
                                                        if (isNaN(t)) return v.Temperature;
                                                        if (v.temperatureUnit === '°F') {
                                                            return `${((t * 9 / 5) + 32).toFixed(1)}°F`;
                                                        }
                                                        return `${t.toFixed(1)}°C`;
                                                    })()}
                                                />
                                            )}
                                            {shouldShow(v.Weight) && <Row label="Weight" value={`${v.Weight} kg`} />}
                                            {shouldShow(v.Height) && <Row label="Height" value={formatHeight(v.Height, v.heightUnit)} />}
                                            {shouldShow(v.bmi) && <Row label="BMI" value={v.bmi} />}
                                            {rt && rapidFields.map(f => {
                                                if (!shouldShow(rt[f])) return null
                                                const rawVal = rt[f]
                                                const shortened = shortenResult(rawVal)
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
                                            {shouldShow(et.leftEye) && <Row label="Left Eye" value={shortenResult(et.leftEyeResult)} />}
                                            {shouldShow(et.rightEye) && <Row label="Right Eye" value={shortenResult(et.rightEyeResult)} />}
                                        </>
                                    )
                                })()}

                                {/* Color Blind Test */}
                                {report.colorBlindTesting && shouldShow(report.colorBlindTesting.colorBlindResult) && (
                                    <>
                                        <SectionTitle title="Color Blind Screening" />
                                        <Row label="Result" value={shortenResult(report.colorBlindTesting.colorBlindResult)} />
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
                                            {shouldShow(ht.leftEarResult) && <Row label="Left Ear" value={shortenResult(ht.leftEarResult)} />}
                                            {shouldShow(ht.rightEarResult) && <Row label="Right Ear" value={shortenResult(ht.rightEarResult)} />}
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
                                    This Digital Report from EZShifa does not require stamp or signature
                                    and is not valid for Legal proceedings.
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Email confirm dialog */}
                    {showEmailConfirm && (
                        <div className="px-5 py-4 border-t border-slate-100 bg-blue-50 space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {emailStatus === 'not_found' ? 'No email on file — add one:' : 'Send report to:'}
                            </p>

                            {/* Email found — show with edit option */}
                            {emailStatus === 'found' && !isEditingEmail && (
                                <div className="flex items-center gap-2">
                                    <span className="flex-1 text-sm font-black text-[#0297d6] truncate">{patientEmail}</span>
                                    <button
                                        onClick={() => { setIsEditingEmail(true); setEditedEmail(patientEmail || '') }}
                                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                                        title="Edit email"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}

                            {/* Editing existing email */}
                            {emailStatus === 'found' && isEditingEmail && (
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={editedEmail}
                                        onChange={e => setEditedEmail(e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs border-2 border-[#0297d6] rounded-xl outline-none font-bold"
                                        placeholder="Enter new email"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleSaveEmail(editedEmail)}
                                        disabled={isSavingEmail || !editedEmail.trim()}
                                        className="px-3 py-2 bg-[#0297d6] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                                    >
                                        {isSavingEmail ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingEmail(false)}
                                        className="px-3 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* No email — input to add */}
                            {emailStatus === 'not_found' && (
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={noEmailInput}
                                        onChange={e => setNoEmailInput(e.target.value)}
                                        className="flex-1 px-3 py-2 text-xs border-2 border-[#0297d6] rounded-xl outline-none font-bold"
                                        placeholder="patient@email.com"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleSaveEmail(noEmailInput)}
                                        disabled={isSavingEmail || !noEmailInput.trim()}
                                        className="px-3 py-2 bg-[#0297d6] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                                    >
                                        {isSavingEmail ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setShowEmailConfirm(false); setEmailStatus('idle'); setIsEditingEmail(false) }}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmSendEmail}
                                    disabled={isSendingEmail || emailStatus === 'not_found' || isEditingEmail}
                                    className="flex-1 py-2.5 rounded-xl bg-[#0297d6] text-white text-xs font-bold hover:bg-[#0286c2] flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    {isSendingEmail ? <><Loader2 size={12} className="animate-spin" />Sending...</> : <><Mail size={12} />Send PDF</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status toasts */}

                    {emailStatus === 'sent' && (
                        <div className="mx-5 mb-2 py-2 px-3 bg-green-100 text-green-700 rounded-xl text-xs font-bold text-center">
                            ✓ Report sent successfully!
                        </div>
                    )}
                    {emailStatus === 'error' && (
                        <div className="mx-5 mb-2 py-2 px-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold text-center">
                            Failed to send email. Try again.
                        </div>
                    )}

                    <div className="px-5 py-4 border-t border-slate-100 flex gap-2 relative">
                        {/* Print button */}
                        <button
                            onClick={handlePrintClick}
                            disabled={loading || !report || isPrinting}
                            className={`flex-1 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all
                                ${(loading || !report) ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-slate-900 hover:bg-[#0297d6] text-white active:scale-95'}`}
                        >
                            {isPrinting ? <><Loader2 size={15} className="animate-spin" />Processing...</> : <><Printer size={15} />Print</>}
                        </button>

                        {/* Action button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowActionDropdown(p => !p)}
                                disabled={loading || !report}
                                className={`h-full px-4 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-1 transition-all
                                    ${(loading || !report) ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-slate-900 hover:bg-[#0297d6] text-white active:scale-95'}`}
                            >
                                Action <ChevronDown size={13} />
                            </button>

                            {showActionDropdown && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10">
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={emailStatus === 'checking'}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        {emailStatus === 'checking'
                                            ? <><Loader2 size={13} className="animate-spin" />Checking...</>
                                            : <><Mail size={13} className="text-[#0297d6]" />Send via Email</>
                                        }
                                    </button>
                                    <div className="border-t border-slate-100" />
                                    <button
                                        onClick={handleSaveAsPdf}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <FileDown size={13} className="text-[#0297d6]" />Save as PDF
                                    </button>
                                </div>
                            )}
                        </div>
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