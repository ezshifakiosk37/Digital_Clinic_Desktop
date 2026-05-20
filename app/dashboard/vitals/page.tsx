//vitals page
'use client'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { COMMON_SYMPTOMS } from './vitals';
import VitalCard from './_components/VitalCard'
import { VitalType } from '@/app/_utils/types'
import { Button } from '@/components/ui/button'
import { apiService } from '@/app/_utils/apiService'
import { Input } from '@/components/ui/input'
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge'
import WeightCalibrationModal from './_components/WeightCalibrationModel';
import TokenDialog from './_components/TokenDialog';
import { useRouter } from 'next/navigation';
import { VideoConsultModel } from './_components/VideoConsultModel';
import HeightCameraModal from './_components/HeightCameraModal';


const VitalsPage = () => {
  const [vitals, setVitals] = useState({
    BP: { value1: '120', value2: '80' },
    PulseRate: "90",
    Temperature: '37',
    Spo2: '93',
    Height: "5.6",
    Weight: "65",
    Sugar: "100",
    symptoms: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [tokenNumber, setTokenNumber] = useState("");
  const [sessionPhone, setSessionPhone] = useState(""); // Phone of current active patient
  const [historySearchPhone, setHistorySearchPhone] = useState(""); // Phone for history lookup
  const [openTokenDialog, setOpenTokenDialog] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [showExpiredToast, setShowExpiredToast] = useState(false);
  const [showInvalidToast, setShowInvalidToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [symptomOther, setSymptomOther] = useState("");
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [manualWeightInput, setManualWeightInput] = useState("");
  const [vitalsId, setVitalsId] = useState<string>("")
  const [step, setStep] = useState<1 | 2>(1);
  const [vitalsError, setVitalsError] = useState(false);
  const [symptomsError, setSymptomsError] = useState(false);
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [vitalsQueue, setVitalsQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [vitalsSearch, setVitalsSearch] = useState("");
  const [isHeightCameraOpen, setIsHeightCameraOpen] = useState(false);
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');
  const [showNoSessionToast, setShowNoSessionToast] = useState(false);

  const router = useRouter()

  useEffect(() => {
    window.onGlucoseReceived = (mgdl) => {
      console.log('Glucose received:', mgdl);
      setVitals(prev => ({ ...prev, BloodSugar: mgdl.toString() }));
    };
    return () => { delete window.onGlucoseReceived; };
  }, []);

  const fetchVitalsQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await apiService.getVitalsQueue();
      if (res.success) setVitalsQueue(res.patients || []);
    } catch (err) {
      console.error("Failed to fetch vitals queue", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const filteredVitalsQueue = useMemo(() => {
    if (!vitalsSearch.trim()) return vitalsQueue;

    const query = vitalsSearch.toLowerCase().trim();

    return vitalsQueue.filter((patient: any) => {
      const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
      const reversedName = `${patient.lastName || ""} ${patient.firstName || ""}`.toLowerCase();
      const token = String(patient.token || "").toLowerCase();
      const phone = String(patient.phoneNumber || "").toLowerCase();

      return (
        fullName.includes(query) ||
        reversedName.includes(query) ||
        token.includes(query) ||
        phone.includes(query)
      );
    });
  }, [vitalsQueue, vitalsSearch]);

  useEffect(() => {
    fetchVitalsQueue();
  }, []);

  useEffect(() => {
    AndroidBridge.initVitalsListener((newVitals) => {
      setVitals(prev => {
        // Create a copy of the previous state
        const updated = { ...prev, ...newVitals };

        // LOGIC: If the incoming data contains BP, we must merge it 
        // specifically to ensure the nested object structure is preserved
        if (newVitals.BP) {
          updated.BP = {
            ...prev.BP,
            ...newVitals.BP
          };
        }

        return updated;
      });
    });

    return () => { window.onSerialData = () => { }; };
  }, []);

  const handleOnlineConsult = async () => {
    if (!vitalsId) {
      alert("Please save vitals first to initiate a consult.");
      return;
    }

    // Logic: Navigate to your Video Call route 
    // (e.g., /video-call/[vitalsId])
    // Your Android WebView will then load this Next.js page.
    router.push(`/video-call/${vitalsId}`);
  };

  // Logic: Initial Trigger (x -> c -> a)
  const handleStartCalibration = async () => {
    const success = await AndroidBridge.startCalibrationSequence();
    if (success) {
      setIsCalibrateModalOpen(true);
    }
  };

  // Logic: Final Trigger (Send the number)
  const handleFinalizeCalibration = () => {
    if (!manualWeightInput) return alert("Enter weight first");

    const success = AndroidBridge.sendFinalCalibrationWeight(manualWeightInput);
    if (success) {
      setIsCalibrateModalOpen(false);
      setManualWeightInput("");
      handleUpdate('Weight', '0'); // Reset UI
    }
  };

  // Logic: Stops the calibration form esp32
  const handleCancelCalibration = () => {
    // 1. Tell the hardware to stop waiting
    AndroidBridge.cancelCalibration();

    // 2. Close the UI
    setIsCalibrateModalOpen(false);

    // 3. Reset local input
    setManualWeightInput("");
  };

  const startSessionFromQueue = (patient: any) => {
    localStorage.setItem("localClinic_entryId", patient.id);
    setSessionPhone(patient.phoneNumber);
    setSessionName(patient.firstName || "");
    setTokenNumber(patient.token || "");
    setOpenTokenDialog(false);
    setHistory([]);
    setHistorySearchPhone("");
    setVitals({
      BP: { value1: '', value2: '' },
      PulseRate: "",
      Temperature: '',
      Spo2: '',
      Height: "",
      Weight: "",
      Sugar: "",
      symptoms: []
    });
    setStep(1);
    // setPatientType('Walk-in');
    setVitalsSaved(false);
    setVitalsId('');
    setVitalsQueue(prev => prev.filter(p => p.id !== patient.id));
  };

  const handleUpdate = (type: keyof typeof vitals, val: string) => {
    setVitals(prev => ({ ...prev, [type]: val }));
  };

  const handleBPUpdate = (field: 'value1' | 'value2', val: string) => {
    setVitals(prev => ({ ...prev, BP: { ...prev.BP, [field]: val } }));
  };

  const handleAddVitals = async () => {
    if (!sessionPhone) {
      setOpenTokenDialog(true);
      setShowNoSessionToast(true);
      setTimeout(() => setShowNoSessionToast(false), 3000);
      return;
    }
    if (!vitals.symptoms.length) {
      setSymptomsError(true);
      setTimeout(() => setSymptomsError(false), 3000);
      return;
    }
    const patientId = localStorage.getItem("localClinic_entryId");
    if (!patientId) {
      alert("No active patient session.");
      return;
    }
    setLoading(true);
    try {
      let result;

      // ALWAYS INSERT NEW ROW
      // Always save height in feet.inches format regardless of display unit
      const heightForSave = heightUnit === 'cm'
        ? (() => {
          const totalInches = parseFloat(vitals.Height) / 2.54;
          const ft = Math.floor(totalInches / 12);
          const inch = Math.round(totalInches % 12);
          return `${ft}.${inch}`;
        })()
        : vitals.Height;

      result = await apiService.saveVitals(patientId, {
        ...vitals,
        Height: heightForSave,
        bmi: bmi?.value ?? null,
        patientType: 'walk-in',
      });

      if (result.success) {
        if (!vitalsSaved) {
          const newVitalsId = result.data?.id ?? result.vitalsId ?? result.data;
          if (!newVitalsId) {
            alert("Failed to capture vitals ID. Please try again.");
            return;
          }
          // setVitalsId(newVitalsId);
          // setVitalsSaved(true);
        }

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle symptom selection
  const toggleSymptom = (symptom: string) => {
    setVitals(prev => {
      const current = prev.symptoms || [];
      if (current.includes(symptom)) {
        return { ...prev, symptoms: current.filter(s => s !== symptom) };
      } else {
        return { ...prev, symptoms: [...current, symptom] };
      }
    });
  };

  const handleNextStep = () => {
    if (!sessionPhone) {
      setOpenTokenDialog(true);
      setShowNoSessionToast(true);
      setTimeout(() => setShowNoSessionToast(false), 3000);
      return;
    }
    const { BP, PulseRate, Temperature, Spo2, Height, Weight } = vitals;
    const allFilled =
      BP.value1 && BP.value2 && PulseRate && Temperature && Spo2 && Height && Weight;
    if (!allFilled) {
      setVitalsError(true);
      setTimeout(() => setVitalsError(false), 3000);
      return;
    }
    setStep(2);
  };
  const handleOtherSymptomChange = (value: string) => {
    const trimmedValue = value.trim();
    setVitals(prev => ({
      ...prev,
      symptoms: [
        ...prev.symptoms.filter(s => !s.startsWith('Other:')),
        trimmedValue ? `Other:${trimmedValue}` : 'Other'
      ]
    }));
  };

  const handleVerifyToken = async () => {
    if (!tokenNumber) return;
    setVerifyingToken(true);

    try {
      const res = await apiService.verifyToken(parseInt(tokenNumber).toString());

      if (res.success) {
        // Fetch latest vitals for this specific token
        const latestRes = await apiService.getLatestVitals(res.patientId, tokenNumber);

        let initialVitals = {
          BP: { value1: '', value2: '' },
          PulseRate: "",
          Temperature: '',
          Spo2: '',
          Height: "",
          Weight: "",
          Sugar: "",
          symptoms: [] as string[]
        };

        if (latestRes.success && latestRes.vital) {
          const v = latestRes.vital;
          initialVitals = {
            BP: {
              value1: v.Systolic || '',
              value2: v.Diastolic || ''
            },
            PulseRate: v.PulseRate || "",
            Temperature: v.Temperature || '',
            Spo2: v.BloodOxygen || '',
            Height: v.Height || "",
            Weight: v.Weight || "",
            Sugar: v.Sugar || "",
            symptoms: v.symptoms
              ? (typeof v.symptoms === 'string'
                ? v.symptoms.split(",").map((s: string) => s.trim())
                : Array.isArray(v.symptoms)
                  ? v.symptoms
                  : [])
              : []
          };
        }

        // Set the vitals (with pre-filled data if available)
        setVitals(initialVitals);

        // Set session info
        localStorage.setItem("localClinic_entryId", res.patientId);
        setSessionPhone(res.phoneNumber);
        setSessionName(res.firstName || "");
        setOpenTokenDialog(false);
        setHistory([]);
        setHistorySearchPhone("");

        setStep(1);
        // setPatientType('Walk-in');
        setVitalsSaved(false);
        setVitalsId('');
      }
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("already used")) {
        setShowExpiredToast(true);
        setTimeout(() => setShowExpiredToast(false), 3000);
      } else {
        setShowInvalidToast(true);
        setTimeout(() => setShowInvalidToast(false), 3000);
      }
    } finally {
      setVerifyingToken(false);
    }
  };

  // Fetch history specifically by phone number (Independent of token)
  const handleSearchHistory = async () => {
    if (!historySearchPhone) {
      alert("Please enter a phone number");
      return;
    }
    setFetching(true);
    try {
      // ONE call instead of TWO. The backend handles the ID tracking now.
      const res = await apiService.getVitalsByPhone(historySearchPhone);

      if (res.success) {
        setHistory(res.vitals);
        if (res.vitals.length === 0) alert("No records found.");
      }
    } catch (error: any) {
      console.error("Search History Error:", error);
      alert(error.message || "Failed to fetch history");
      setHistory([]);
    } finally {
      setFetching(false);
    }
  };


  const exportToExcel = () => {
    if (!history.length) return;

    // Patient info rows at top
    const infoRows = [
      { "Patient Name": sessionName, "Phone Number": historySearchPhone },
      {}, // empty row as spacer
    ];

    const dataRows = history.map((rec: any) => ({
      "Date": rec.createdDate,
      "Time": rec.createdTime,
      "Blood Pressure": `${rec.BP?.value1}/${rec.BP?.value2} mmHg`,
      "Pulse (bpm)": `${rec.PulseRate} bpm`,
      "Blood Oxygen (%)": `${rec.Spo2} %`,
      "Weight (kg)": `${rec.Weight} kg`,
      "Height (ft)": `${rec.Height} ft`,
      "Temperature (°C)": `${rec.Temperature} °C`,
      "Symptoms": Array.isArray(rec.symptoms)
        ? rec.symptoms.join(", ")
        : (rec.symptoms || "—"),
    }));

    const ws = XLSX.utils.json_to_sheet([...infoRows, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VitalsHistory");
    XLSX.writeFile(wb, `History_${historySearchPhone}.xlsx`);
  };

  const exportToPDF = () => {
    if (!history.length) return;
    const doc = new jsPDF();

    // Patient info header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Vitals Report", 14, 14);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${sessionName}`, 14, 24);
    doc.text(`Phone: ${historySearchPhone}`, 14, 31);

    // Vitals table
    const tableData = history.map((rec: any) => [
      rec.createdDate,
      rec.createdTime,
      `${rec.BP?.value1}/${rec.BP?.value2}`,
      rec.PulseRate,
      rec.Spo2,
      rec.Weight,
      rec.Height,
      rec.Temperature,
      Array.isArray(rec.symptoms)
        ? rec.symptoms.join(", ")
        : (rec.symptoms || "—"),

    ]);

    autoTable(doc, {
      head: [["Date", "Time", "BP (mmHg)", "Pulse", "SpO2 (%)", "Weight (kg)", "Height (ft)", "Temp (°C)", "Symptoms"]],
      body: tableData,
      startY: 38,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [2, 151, 214] },
      columnStyles: { 8: { cellWidth: 50 } },
    });

    doc.save(`History_${historySearchPhone}.pdf`);
  };


  const bmi = useMemo(() => {
    const weight = parseFloat(vitals.Weight);
    const feet = parseFloat(vitals.Height?.split('.')[0] || '0');
    const inches = parseFloat(vitals.Height?.split('.')[1] || '0');
    const heightMeters = ((feet * 12) + inches) * 0.0254;
    if (!weight || !heightMeters) return null;
    const value = weight / (heightMeters * heightMeters);
    let label = '';
    let color = '';
    if (value < 18.5) { label = 'Underweight'; color = 'text-purple-500'; }
    else if (value < 25) { label = 'Healthy'; color = 'text-purple-500'; }
    else if (value < 30) { label = 'Overweight'; color = 'text-purple-500'; }
    else { label = 'Obese'; color = 'text-purple-500'; }
    return { value: value.toFixed(1), label, color };
  }, [vitals.Weight, vitals.Height]);

  // Convert "feet.inches" string → total inches
  const feetDotInchesToInches = (val: string): number => {
    const [f, i] = val.split('.');
    return (parseInt(f) || 0) * 12 + (parseInt(i) || 0);
  };
  // Convert total inches → "feet.inches"
  const inchesToFeetDot = (totalInches: number): string => {
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return `${ft}.${inch}`;
  };
  // Convert "feet.inches" → cm string (rounded to 1 decimal)
  const feetDotToCm = (val: string): string => {
    const totalInches = feetDotInchesToInches(val);
    return (totalInches * 2.54).toFixed(1);
  };
  // Convert cm string → "feet.inches"
  const cmToFeetDot = (val: string): string => {
    const totalInches = parseFloat(val) / 2.54;
    return inchesToFeetDot(totalInches);
  };
  // Toggle unit and convert current height value
  const toggleHeightUnit = () => {
    setHeightUnit(prev => {
      if (prev === 'ft') {
        // ft → cm: convert stored "feet.inches" to cm
        const cm = feetDotToCm(vitals.Height || '0.0');
        handleUpdate('Height', cm);
        return 'cm';
      } else {
        // cm → ft: convert stored cm back to "feet.inches"
        const ftDot = cmToFeetDot(vitals.Height || '0');
        handleUpdate('Height', ftDot);
        return 'ft';
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-[#0297d6] text-white px-4 py-3 shadow-md top-0 z-40">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items- gap-2.5">
            {/* <div className="bg-white/20 p-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div> */}
            <div className='flex-row'>
              <p className="text-xl font-bold leading-tight">EZShifa:<span className="text-sm text-white/70"> Digital Health Clinic </span></p>

            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOpenTokenDialog(true)}
            className="bg-white text-[#0297d6] hover:bg-white/90 font-bold text-xs lg:text-lg h-8 px-3"
          >
            + Add Token
          </Button>
        </div>
      </nav>

      <div className="pl-4 pr-4 sm:pr-6 py-1 md:py-3">
        {/* ── PAGE HEADING ── */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Patient Vitals</h2>
          {sessionPhone ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="text-sm text-slate-600">
                <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wide mr-1">NAME</span>
                <span className="font-bold text-slate-700">{sessionName || '—'}</span>
              </span>
              <span className="text-sm text-slate-600">
                <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wide mr-1">PHONE</span>
                <span className="font-bold text-slate-700">{sessionPhone}</span>
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">No active session — enter token or start from queue below</p>
          )}
        </div>

        {/* Token Already Used Toast */}
        <div className={`fixed top-6 right-6 z-100 transition-all duration-500 ${showExpiredToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <div className="bg-white/20 rounded-full p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            Token #{tokenNumber} has already been used today.
          </div>
        </div>

        {/* Invalid Token Toast */}
        <div className={`fixed top-6 right-6 z-100 transition-all duration-500 ${showInvalidToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-purple-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <div className="bg-white/20 rounded-full p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            Token #{tokenNumber} is invalid or not generated for today.
          </div>
        </div>

        {/* Symptoms Error Toast */}
        <div className={`fixed top-6 right-6 z-100 transition-all duration-500 ${symptomsError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-purple-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <div className="bg-white/20 rounded-full p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            Please add at least one symptom before saving.
          </div>
        </div>

        {/* No Session Toast */}
        <div className={`fixed top-6 right-6 z-100 transition-all duration-500 ${showNoSessionToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-orange-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <div className="bg-white/20 rounded-full p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            Please enter a token to start recording vitals.
          </div>
        </div>
        {/* Success Toast */}
        <div className={`fixed top-6 right-6 z-100 transition-all duration-500 ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <div className="bg-white/20 rounded-full p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            Vitals recorded successfully!
          </div>
        </div>

        <div className="relative">
          {openTokenDialog && (
            <>

              {/* Token card — centered over vitals */}
              <TokenDialog
                isOpen={openTokenDialog}
                tokenNumber={tokenNumber}
                onClose={() => setOpenTokenDialog(false)}
                setTokenNumber={setTokenNumber}
                onVerify={handleVerifyToken}
                isVerifying={verifyingToken}
              />
            </>
          )}

          <section className={openTokenDialog ? "blur-sm pointer-events-none" : ""}>

            {/* ── PERSISTENT HEADER (shows on both steps) ── */}
            {/* Step indicator */}
            <div className="flex justify-center items-center gap-2 mb-5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === 1 ? 'bg-[#0297d6] text-white' : 'bg-green-500 text-white'}`}>
                {step === 1 ? '1' : '✓'}
              </div>
              <div className="w-8 h-0.5 bg-slate-200" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === 2 ? 'bg-[#0297d6] text-white' : 'bg-slate-200 text-slate-400'}`}>
                2
              </div>
            </div>

            {/* ── STEP 1: VITALS ── */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  <VitalCard type={VitalType.PULSE_RATE} onChange={(val) => handleUpdate('PulseRate', val)} value={vitals.PulseRate} />
                  <VitalCard type={VitalType.BLOOD_PRESSURE} onChange1={(val) => handleBPUpdate('value1', val)} onChange2={(val) => handleBPUpdate('value2', val)} isDualValue value1={vitals.BP.value1} value2={vitals.BP.value2} />
                  <VitalCard type={VitalType.TEMPERATURE} onChange={(val) => handleUpdate('Temperature', val)} value={vitals.Temperature} />
                  <VitalCard type={VitalType.BLOOD_OXYGEN} onChange={(val) => handleUpdate('Spo2', val)} value={vitals.Spo2} />
                  <VitalCard
                    type={VitalType.WEIGHT}
                    onChange={(val) => handleUpdate('Weight', val)}
                    value={vitals.Weight}
                    onCalibrate={handleStartCalibration}
                  />
                  <WeightCalibrationModal
                    isOpen={isCalibrateModalOpen}
                    onClose={handleCancelCalibration}
                    onConfirm={handleFinalizeCalibration}
                    knownWeightValue={manualWeightInput}
                    setKnownWeightValue={setManualWeightInput}
                  />
                  <VitalCard
                    type={VitalType.HEIGHT}
                    toggleHeightUnit={toggleHeightUnit}
                    heightUnit={heightUnit}
                    customContent={
                      <div className="flex flex-col gap-2 w-full">
                        {/* Unit toggle + camera button */}
                        <div className="flex items-center gap-2">
                          {/* ft/cm toggle
                          <button
                            onClick={toggleHeightUnit}
                            className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 text-xs font-bold shrink-0"
                          >
                            <span className={`px-2 py-1 rounded-md transition-colors ${heightUnit === 'ft' ? 'bg-[#0297d6] text-white' : 'text-slate-400'}`}>ft</span>
                            <span className={`px-2 py-1 rounded-md transition-colors ${heightUnit === 'cm' ? 'bg-[#0297d6] text-white' : 'text-slate-400'}`}>cm</span>
                          </button> */}
                          {/* Camera measure button */}


                        </div>
                        <div className='flex w-full justify-between'>
                          {/* Input fields */}
                          {heightUnit === 'ft' ? (
                            <div className="flex items-baseline gap-1">
                              <input
                                type="text" placeholder="--"
                                value={vitals.Height?.split('.')[0] || ''}
                                onChange={(e) => {
                                  const inches = vitals.Height?.split('.')[1] || '0';
                                  handleUpdate('Height', `${e.target.value}.${inches}`);
                                }}
                                className="text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none w-12 md:w-14 rounded px-1"
                              />
                              <span className="text-slate-400 font-medium">ft</span>
                              <input
                                type="text" placeholder="--"
                                value={vitals.Height?.split('.')[1] || ''}
                                onChange={(e) => {
                                  const feet = vitals.Height?.split('.')[0] || '0';
                                  handleUpdate('Height', `${feet}.${e.target.value}`);
                                }}
                                className="text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none w-12 md:w-14 rounded px-1"
                              />
                              <span className="text-slate-400 font-medium">in</span>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <input
                                type="text" placeholder="--"
                                value={Math.round(parseFloat(vitals.Height)).toString() || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  handleUpdate('Height', val);
                                }}
                                className="text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none w-24 md:w-28 rounded px-1"
                              />
                              <span className="text-slate-400 font-medium">cm</span>
                            </div>
                          )}

                          <Button onClick={() => setIsHeightCameraOpen(true)} className='px-3 scale-70 lg:scale-90 '>Measure Height</Button>
                        </div>
                      </div>
                    }
                  />
                  <VitalCard
                    type={VitalType.BMI}
                    value={bmi?.value ?? '—'}
                    statusLabel={bmi?.label ?? 'Fill weight & height'}
                    statusColor={bmi?.color}
                  />
                  <VitalCard
                    type={VitalType.BLOOD_SUGAR}
                    value={vitals.Sugar}
                    onChange={(val) => handleUpdate('Sugar', val)}
                  />
                </div>
                {vitalsError && (
                  <div className="flex justify-end mt-4">
                    <div className="bg-purple-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
                      <span>⚠️ Please fill all the vitals before proceeding.</span>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleNextStep}
                    className="px-8 py-5 text-base font-bold"
                  >
                    Next →
                  </Button>
                </div>
              </>
            )}

            {/* ── STEP 2: SYMPTOMS + CONSULT TYPE + SAVE ── */}
            {step === 2 && (
              <>
                {/* Consultation Type Selector
                <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/10 border border-slate-100 mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Consultation Type</p>
                  <div className="flex gap-3">
                    {(['Walk-in', 'Online Consultation'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setPatientType(type)}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all border-2 ${patientType === type
                          ? 'bg-primary text-white border-primary'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/40'
                          }`}
                      >
                        {type === 'Walk-in' ? '🏥 Walk-in' : '💻 Online Consultation'}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Symptoms */}
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Symptoms</p>

                  {vitals.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {vitals.symptoms.filter(s => s !== 'Other').map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                          {s.startsWith('Other:') ? `Other: ${s.slice(6)}` : s}
                          <button onClick={() => { setVitals(prev => ({ ...prev, symptoms: prev.symptoms.filter((_, idx) => idx !== i) })); if (s.startsWith('Other:')) setSymptomOther(''); }} className="hover:text-red-400">✕</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-0 text-left bg-slate-50/50">
                        <div className="flex flex-wrap gap-1 py-1">
                          {vitals.symptoms.length > 0 ? (
                            vitals.symptoms.map((s) => (
                              <span key={s} className="bg-[#0297d6]/10 text-[#0297d6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20">{s.startsWith('Other:') ? 'Other' : s}</span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm">Search symptoms...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search symptom..." />
                        <CommandList>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {COMMON_SYMPTOMS.map((option) => (
                              <CommandItem key={option} onSelect={() => { setVitals(prev => ({ ...prev, symptoms: prev.symptoms.includes(option) ? prev.symptoms.filter(s => s !== option) : [...prev.symptoms, option] })); }} className="flex items-center gap-2">
                                <div className={`flex h-4 w-4 items-center justify-center rounded border border-primary ${vitals.symptoms.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"}`}>
                                  {vitals.symptoms.includes(option) && <Check className="h-3 w-3" />}
                                </div>
                                <span>{option}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {(vitals.symptoms.includes('Other') || vitals.symptoms.some(s => s.startsWith('Other:'))) && (
                    <div className="flex gap-2 mt-2">
                      <input autoFocus placeholder="Specify other symptom..."
                        className="flex-1 p-3 bg-white border-2 border-[#0297d6] rounded-xl outline-none font-bold text-sm"
                        value={symptomOther}
                        onChange={(e) => { setSymptomOther(e.target.value); handleOtherSymptomChange(e.target.value); }}
                      />
                      <button onClick={() => { setVitals(prev => ({ ...prev, symptoms: prev.symptoms.filter(s => s !== 'Other' && !s.startsWith('Other:')) })); setSymptomOther(''); }}
                        className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black">✕</button>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className='flex justify-between w-full gap-3'>
                  <Button variant="outline" onClick={() => setStep(1)} className="px-6 py-5">
                    ← Back
                  </Button>
                  <div className="flex gap-3">
                    {/* {patientType === 'Online Consultation' && (
                    <div className="relative group">
                      <Button
                        onClick={() => vitalsId && setIsVideoModalOpen(true)}
                        variant="outline"
                        className={`px-6 py-5 transition-all ${!vitalsId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Online Consult
                      </Button>
                      {!vitalsId && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Add vitals first
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </div>
                      )}
                    </div>
                  )} */}
                    <Button onClick={handleAddVitals} disabled={loading} className="px-8 py-5 text-base font-bold">
                      {loading ? (
                        <><Loader2 className="animate-spin mr-2 h-4 w-4" />{vitalsSaved ? 'Updating...' : 'Saving...'}</>
                      ) : vitalsSaved ? (
                        showSuccessToast ? "Updated ✓" : "Update Vitals"
                      ) : (
                        showSuccessToast ? "Vitals Added ✓" : "Add Vitals"
                      )}
                    </Button>
                  </div>
                </div>

                {/* ── HISTORY (Step 2 only) ── */}
                <div className="mt-8 md:mt-12">
                  <Button onClick={() => setShowHistory(p => !p)} variant="outline">
                    {showHistory ? "Hide History" : "Search Patient History"}
                  </Button>

                  {showHistory && (
                    <div className="mt-6 space-y-4">
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-end bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-200">
                        <div className="flex-1 min-w-50">
                          <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Patient Phone Number</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. 03001234567"
                              value={historySearchPhone}
                              onChange={(e) => setHistorySearchPhone(e.target.value)}
                              className="bg-white"
                            />
                            <Button onClick={handleSearchHistory} size="icon" className="shrink-0">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={exportToExcel} disabled={!history.length} variant="secondary">Excel</Button>
                          <Button onClick={exportToPDF} disabled={!history.length} variant="secondary">PDF</Button>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                        <table className="w-full min-w-150 text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Token</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">BP</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pulse</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">SpO2</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Temp</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">W/H</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Symptoms</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {fetching ? (
                              <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500">Searching records...</td></tr>
                            ) : history.length > 0 ? (
                              history.map((record: any) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-bold text-[#0297d6]">{record.token || "—"}</td>
                                  <td className="px-6 py-4 text-sm text-slate-500">{record.createdDate}</td>
                                  <td className="px-6 py-4 text-sm text-slate-500">{record.createdTime}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-blue-600">
                                    {record.BP?.value1}/{record.BP?.value2} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{record.PulseRate} bpm</td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{record.Spo2}%</td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{record.Temperature}°C</td>
                                  <td className="px-6 py-4 text-sm text-slate-600">
                                    {record.Weight}kg / {(() => {
                                      const parts = record.Height?.split('.');
                                      return parts?.length === 2 ? `${parts[0]}ft ${parts[1]} in` : `${record.Height} ft`;
                                    })()}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">
                                    {Array.isArray(record.symptoms) ? record.symptoms.join(", ") : (record.symptoms || "—")}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No history found. Search by phone to view records.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </section>

          {/* Height Camera Modal — OUTSIDE section to avoid blur/pointer-events issues */}
          <HeightCameraModal
            isOpen={isHeightCameraOpen}
            onClose={() => setIsHeightCameraOpen(false)}
            onConfirm={(heightFeetDot) => {
              if (heightUnit === 'ft') {
                handleUpdate('Height', heightFeetDot);
              } else {
                const [f, i] = heightFeetDot.split('.');
                const totalInches = (parseInt(f) || 0) * 12 + (parseInt(i) || 0);
                handleUpdate('Height', (totalInches * 2.54).toFixed(1));
              }
            }}
          />
        </div>
        <div className="mt-6">
          {/* Header with Search */}
          <div className="px-4 md:px-6 py-4 border-b flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-white rounded-t-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-800">Waiting for Vitals</h3>
              <p className="text-xs text-slate-400">Patients who have a token but vitals not recorded yet</p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="text"
                value={vitalsSearch}
                onChange={(e) => setVitalsSearch(e.target.value)}
                placeholder="Search by token, name or phone..."
                className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full md:w-72 focus:outline-none focus:border-[#0297d6]"
              />
              <button
                onClick={() => setVitalsSearch("")}
                className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 whitespace-nowrap"
              >
                Clear
              </button>
              <button
                onClick={fetchVitalsQueue}
                disabled={loadingQueue}
                className="px-4 py-2 text-sm rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0297d6] disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-b-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loadingQueue ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <div className="w-5 h-5 border-2 border-[#0297d6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading queue...
              </div>
            ) : filteredVitalsQueue.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                {vitalsSearch ? "No matching patients found" : "No patients waiting for vitals"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-3">Sr.</th>
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Phone</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredVitalsQueue.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-bold text-[#0297d6]">#{p.token}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          {p.firstName} {p.lastName}
                          <span className="sm:hidden block text-xs text-slate-400 font-normal">{p.phoneNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 hidden sm:table-cell">{p.phoneNumber}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => startSessionFromQueue(p)}
                            className="bg-[#0297d6] hover:bg-[#0286c2] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                          >
                            START
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VitalsPage