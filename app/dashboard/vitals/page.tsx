'use client'
import React, { useCallback, useEffect, useState } from 'react'
import VitalCard from './_components/VitalCard'
import { VitalType } from '@/app/_utils/types'
import { Button } from '@/components/ui/button'
import { apiService } from '@/app/_utils/apiService'
import { Input } from '@/components/ui/input'
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay
} from "@/components/ui/dialog";

const VitalsPage = () => {
  const [vitals, setVitals] = useState({
    BP: { value1: '120', value2: '80' },
    PulseRate: "90",
    Temperature: '37',
    Spo2: '93',
    Height: "5.6",
    Weight: "65"
  });

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [tokenNumber, setTokenNumber] = useState("");
  const [sessionPhone, setSessionPhone] = useState(""); // Phone of current active patient
  const [historySearchPhone, setHistorySearchPhone] = useState(""); // Phone for history lookup
  const [openTokenDialog, setOpenTokenDialog] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);

  // Verify token and start a session
  const handleVerifyToken = async () => {
    if (!tokenNumber) return;
    try {
      const res = await apiService.verifyToken(tokenNumber);
      if (res.success) {
        localStorage.setItem("localClinic_entryId", res.patientId);
        setSessionPhone(res.phoneNumber);
        setSessionName(res.firstName || "");
        setOpenTokenDialog(false);
        setHistory([]);
        setHistorySearchPhone("");
        // Reset all vitals to 0 on new patient session
        setVitals({
          BP: { value1: '0', value2: '0' },
          PulseRate: "0",
          Temperature: '0',
          Spo2: '0',
          Height: "0",
          Weight: "0"
        });
      }
    }
    catch (error: any) {
      if (error.message === "Token already used today") {
        setShowExpiredDialog(true);
      } else {
        alert(error.message || "Invalid token number");
      }
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
        alert("Vitals recorded successfully!");
        // Reset and go back to token dialog for next patient
        setVitals({ BP: { value1: '120', value2: '80' }, PulseRate: "90", Temperature: '37', Spo2: '93', Height: "5.6", Weight: "65" });
        setTokenNumber("");
        setSessionPhone("");
        setOpenTokenDialog(true);
      }
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
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
    ]);

    autoTable(doc, {
      head: [["Date", "Time", "BP (mmHg)", "Pulse", "SpO2 (%)", "Weight (kg)", "Height (ft)", "Temp (°C)"]],
      body: tableData,
      startY: 38,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [2, 151, 214] },
    });

    doc.save(`History_${historySearchPhone}.pdf`);
  };

  return (
    <div className="pr-6 py-12 relative">
      <Dialog open={openTokenDialog} modal={false}>
        <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Enter Token Number</DialogTitle>
            <DialogDescription>Verify the patient token from the reception.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <input
              type="text"
              placeholder="Enter Token"
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center text-xl font-semibold focus:ring-2 focus:ring-primary outline-none"
            />
            <button onClick={handleVerifyToken} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90">
              Verify Token
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <DialogHeader>
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 text-3xl font-black">!</span>
            </div>
            <DialogTitle className="text-2xl text-center text-red-600">Token Already Used</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Vitals for token <span className="font-bold text-slate-800">#{tokenNumber}</span> have already been recorded today. Please check the token number and try again.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowExpiredDialog(false);
              setTokenNumber("");
            }}
            className="w-full mt-4 bg-red-500 hover:bg-red-600 h-12 text-lg font-bold"
          >
            Try Again
          </Button>
        </DialogContent>
      </Dialog>

      <section className={openTokenDialog ? "blur-sm" : ""}>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Patient Vitals</h2>
            {sessionPhone && <p className="text-blue-600 font-medium">Active Session: {sessionPhone}</p>}
          </div>
          <Button onClick={handleAddVitals} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Add Vitals"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <VitalCard type={VitalType.PULSE_RATE} onChange={(val) => handleUpdate('PulseRate', val)} value={vitals.PulseRate} />
          <VitalCard type={VitalType.BLOOD_PRESSURE} onChange1={(val) => handleBPUpdate('value1', val)} onChange2={(val) => handleBPUpdate('value2', val)} isDualValue value1={vitals.BP.value1} value2={vitals.BP.value2} />
          <VitalCard type={VitalType.TEMPERATURE} onChange={(val) => handleUpdate('Temperature', val)} value={vitals.Temperature} />
          <VitalCard type={VitalType.BLOOD_OXYGEN} onChange={(val) => handleUpdate('Spo2', val)} value={vitals.Spo2} />
          <VitalCard type={VitalType.WEIGHT} onChange={(val) => handleUpdate('Weight', val)} value={vitals.Weight} />
          <VitalCard type={VitalType.HEIGHT} onChange={(val) => handleUpdate('Height', val)} value={vitals.Height} />
        </div>
      </section>

      <div className="mt-12">
        <Button onClick={() => setShowHistory(p => !p)} variant="outline">
          {showHistory ? "Hide History" : "Search Patient History"}
        </Button>

        {showHistory && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
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
                        <td className="px-6 py-4 text-sm text-slate-600">{record.Weight}kg / {record.Height}ft</td>
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
    </div>
  )
}

export default VitalsPage