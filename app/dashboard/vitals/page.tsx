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
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge'
import WeightCalibrationModal from './_components/WeightCalibrationModel';
import TokenDialog from './_components/TokenDialog';


const VitalsPage = () => {
  const [vitals, setVitals] = useState({
    BP: { value1: '120', value2: '80' },
    PulseRate: "90",
    Temperature: '37',
    Spo2: '93',
    Height: "5.6",
    Weight: "65",
    symptoms: [] as string[]
  });

  const [otherSymptom, setOtherSymptom] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [tokenNumber, setTokenNumber] = useState("");
  const [sessionPhone, setSessionPhone] = useState(""); // Phone of current active patient
  const [historySearchPhone, setHistorySearchPhone] = useState(""); // Phone for history lookup
  const [openTokenDialog, setOpenTokenDialog] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [symptomOther, setSymptomOther] = useState("");
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [manualWeightInput, setManualWeightInput] = useState("");

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

  const handleUpdate = (type: keyof typeof vitals, val: string) => {
    setVitals(prev => ({ ...prev, [type]: val }));
  };

  const handleBPUpdate = (field: 'value1' | 'value2', val: string) => {
    setVitals(prev => ({ ...prev, BP: { ...prev.BP, [field]: val } }));
  };

  const handleAddVitals = async () => {
    const patientId = localStorage.getItem("localClinic_entryId");
    if (!patientId) {
      alert("No active patient session.");
      return;
    }
    setLoading(true);
    try {
      const result = await apiService.saveVitals(patientId, vitals);
      if (result.success) {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        // Reset and go back to token dialog for next patient
        setVitals({ BP: { value1: '120', value2: '80' }, PulseRate: "90", Temperature: '37', Spo2: '93', Height: "5.6", Weight: "65", symptoms: [] });
        setTokenNumber("");
        setSessionPhone("");
        setOpenTokenDialog(true);
        setOtherSymptom("");
        setShowOtherInput(false);
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

  // Handle "Other" symptom
  // const addOtherSymptom = () => {
  //   if (otherSymptom.trim()) {
  //     setVitals(prev => ({
  //       ...prev,
  //       symptoms: [...(prev.symptoms || []), otherSymptom.trim()]
  //     }));
  //     setOtherSymptom("");
  //     setShowOtherInput(false);
  //   }
  // };

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

  // Verify token and start a session
  const handleVerifyToken = async () => {
    if (!tokenNumber) return;
    setVerifyingToken(true);
    try {
      const res = await apiService.verifyToken(parseInt(tokenNumber).toString());
      if (res.success) {
        localStorage.setItem("localClinic_entryId", res.patientId);
        setSessionPhone(res.phoneNumber);
        setSessionName(res.firstName || "");
        setOpenTokenDialog(false);
        setHistory([]);
        setHistorySearchPhone("");
        // Reset all vitals to 0 on new patient session
        setVitals({
          BP: { value1: '', value2: '' },
          PulseRate: "",
          Temperature: '',
          Spo2: '',
          Height: "",
          Weight: "",
          symptoms: []
        });
      }
    }
    catch (error: any) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("already used")) {
        setShowExpiredDialog(true);
      } else {
        alert(msg || "Invalid token number");
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

  return (
    <div className="pl-4 pr-4 sm:pr-6 py-1 md:py-3 relative justify-center-safe">
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
      {/* Token expire dialog box */}
      <Dialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <DialogHeader>
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-600 text-3xl font-black">!</span>
            </div>
            <DialogTitle className="text-2xl text-center text-blue-600">Token Already Used</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Vitals for token <span className="font-bold text-slate-800">#{tokenNumber}</span> have already been recorded today. Please check the token number and try again.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowExpiredDialog(false);
              setTokenNumber("");
            }}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 h-12 text-lg font-bold"
          >
            Try Again
          </Button>
        </DialogContent>
      </Dialog>

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
          <div className='flex flex-wrap justify-between items-center gap-3 mb-6'>
            <div>
              <h2 className="text-xl md:text-3xl font-extrabold text-slate-900">Patient Vitals</h2>
              {sessionPhone && <p className="text-blue-600 text-sm font-medium">Active Session: {sessionPhone}</p>}
            </div>
            <Button onClick={() => setOpenTokenDialog(true)}>Add Token</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            <VitalCard type={VitalType.PULSE_RATE} onChange={(val) => handleUpdate('PulseRate', val)} value={vitals.PulseRate} />
            <VitalCard type={VitalType.BLOOD_PRESSURE} onChange1={(val) => handleBPUpdate('value1', val)} onChange2={(val) => handleBPUpdate('value2', val)} isDualValue value1={vitals.BP.value1} value2={vitals.BP.value2} />
            <VitalCard type={VitalType.TEMPERATURE} onChange={(val) => handleUpdate('Temperature', val)} value={vitals.Temperature} />
            <VitalCard type={VitalType.BLOOD_OXYGEN} onChange={(val) => handleUpdate('Spo2', val)} value={vitals.Spo2} />
            <VitalCard
              type={VitalType.WEIGHT}
              onChange={(val) => handleUpdate('Weight', val)}
              value={vitals.Weight}
              onCalibrate={handleStartCalibration} // Separated function reference
            />
            {/* The Separated Modal */}
            <WeightCalibrationModal
              isOpen={isCalibrateModalOpen}
              onClose={handleCancelCalibration}
              onConfirm={handleFinalizeCalibration}
              knownWeightValue={manualWeightInput}
              setKnownWeightValue={setManualWeightInput}
            />
            <VitalCard
              type={VitalType.HEIGHT}
              customContent={
                <div className="flex items-baseline gap-1 w-full">
                  <input
                    type="text"
                    placeholder="--"
                    value={vitals.Height?.split('.')[0] || ''}
                    onChange={(e) => {
                      const inches = vitals.Height?.split('.')[1] || '0';
                      handleUpdate('Height', `${e.target.value}.${inches}`);
                    }}
                    className="text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none w-12 md:w-14 rounded px-1"
                  />
                  <span className="text-slate-400 font-medium">ft</span>
                  <input
                    type="text"
                    placeholder="--"
                    value={vitals.Height?.split('.')[1] || ''}
                    onChange={(e) => {
                      const feet = vitals.Height?.split('.')[0] || '0';
                      handleUpdate('Height', `${feet}.${e.target.value}`);
                    }}
                    className="text-2xl md:text-4xl font-bold text-secondary border-b-2 border-transparent focus:border-primary focus:outline-none w-12 md:w-14 rounded px-1"
                  />
                  <span className="text-slate-400 font-medium">in</span>
                </div>
              }
            />
            <div className="col-span-2 md:col-span-2 lg:col-span-1 lg:col-start-2">
              <div className='justify-center w-full sm:w-79 md:w-79 md:ml-40 lg:w-full lg:ml-0'>
                <VitalCard
                  type={VitalType.BMI}
                  customContent={
                    <div className="flex items-baseline justify-between w-full">
                      <span className="text-2xl md:text-4xl font-bold text-secondary">
                        {bmi ? bmi.value : '—'}
                      </span>
                      <span className={`text-sm font-bold ${bmi ? bmi.color : 'text-slate-400'}`}>
                        {bmi ? bmi.label : 'Fill weight & height'}
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Symptoms</p>

            {/* Display Selected Symptoms Tags */}
            {vitals.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {vitals.symptoms.filter(s => s !== 'Other').map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-black text-[#0297d6] bg-[#0297d6]/10 px-3 py-1 rounded-lg">
                    {s.startsWith('Other:') ? `Other: ${s.slice(6)}` : s}
                    <button
                      onClick={() => {
                        setVitals(prev => ({
                          ...prev,
                          symptoms: prev.symptoms.filter((_, idx) => idx !== i)
                        }));
                        if (s.startsWith('Other:')) setSymptomOther('');
                      }}
                      className="hover:text-red-400"
                    >✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* Selection Popover */}
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
                        <CommandItem
                          key={option}
                          onSelect={() => {
                            setVitals(prev => ({
                              ...prev,
                              symptoms: prev.symptoms.includes(option)
                                ? prev.symptoms.filter(s => s !== option)
                                : [...prev.symptoms, option]
                            }));
                          }}
                          className="flex items-center gap-2"
                        >
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

            {/* "Other" Input Field (only shows if 'Other' is selected or a custom Other string exists) */}
            {(vitals.symptoms.includes('Other') || vitals.symptoms.some(s => s.startsWith('Other:'))) && (
              <div className="flex gap-2 mt-2">
                <input
                  autoFocus
                  placeholder="Specify other symptom..."
                  className="flex-1 p-3 bg-white border-2 border-[#0297d6] rounded-xl outline-none font-bold text-sm"
                  value={symptomOther}
                  onChange={(e) => {
                    setSymptomOther(e.target.value);
                    handleOtherSymptomChange(e.target.value);
                  }}
                />
                <button
                  onClick={() => {
                    setVitals(prev => ({
                      ...prev,
                      symptoms: prev.symptoms.filter(s => s !== 'Other' && !s.startsWith('Other:'))
                    }));
                    setSymptomOther('');
                  }}
                  className="px-3 text-slate-400 hover:text-red-400 bg-white border border-slate-200 rounded-xl text-xs font-black"
                >✕</button>
              </div>
            )}
          </div>
          <div className='flex justify-between w-full'>
            <div>
              <Button onClick={handleAddVitals} disabled={loading} className="shrink-0 ml-auto px-8 py-5 text-base font-bold">
                {loading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Saving...</> : "Add Vitals"}
              </Button>
            </div>
            <Button>Online Consult</Button>
          </div>
        </section>
      </div>
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
                          {Array.isArray(record.symptoms)
                            ? record.symptoms.join(", ")
                            : (record.symptoms || "—")}
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
    </div >
  )
}

export default VitalsPage