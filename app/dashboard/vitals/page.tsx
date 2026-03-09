'use client'
import React, { useCallback, useEffect, useState } from 'react'
import VitalCard from './_components/VitalCard'
import { VitalType } from '@/app/_utils/types'
import { Button } from '@/components/ui/button'
import { apiService } from '@/app/_utils/apiService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay
} from "@/components/ui/dialog";

const page = () => {
  const [vitals, setVitals] = useState({
    BP: { value1: '120', value2: '80' },
    PulseRate: "90",
    Temperature: '37',
    Spo2: '93',
    Height: "5.6",
    Weight: "65"
  });
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [tokenNumber, setTokenNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [openTokenDialog, setOpenTokenDialog] = useState(true);

  const fetchHistory = useCallback(async () => {
    const patientId = localStorage.getItem("localClinic_entryId");
    if (!patientId) {
      setFetching(false);
      return;
    }
    try {
      const data = await apiService.getVitals(patientId);
      setHistory(data.success ? data.vitals : []);
    } catch (error) {
      console.error("Fetch History Error:", error);
    } finally {
      setFetching(false);
    }
  }, []);

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
        setOpenTokenDialog(true);
        setVitals({ BP: { value1: '', value2: '' }, PulseRate: "", Temperature: '', Spo2: '', Height: "", Weight: "" });
      }
    } catch (error: any) {
      console.error("Vitals Submission Error:", error);
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="pr-6 py-12 relative">
      {/* Dialog */}
      <Dialog open={openTokenDialog} modal={false}>
        {/* Dark overlay but still see page */}
        <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        
        {/* dialog */}
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
        >
          <DialogHeader>
            <DialogTitle>Enter Token Number</DialogTitle>
            <DialogDescription>
              Enter the patient token number to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <input
              type="text"
              placeholder="Enter Token"
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-center text-xl font-semibold"
            />

            {phoneNumber && (
              <p className="text-sm text-slate-600 font-medium text-center">
                Phone: {phoneNumber}
              </p>
            )}

            <button
              // onClick={async () => {
              //   if (!tokenNumber) return;
              //   try {
              //     const res = await apiService.getPhoneByToken(tokenNumber);
              //     if (res.success) {
              //       setPhoneNumber(res.phone);
              //       setOpenTokenDialog(false);
              //     } else {
              //       alert("Invalid token number");
              //     }
              //   } catch (error) {
              //     console.error(error);
              //     alert("Error verifying token");
              //   }
              // }}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold"
            >
              Verify Token
            </button>
          </div>
        </DialogContent>
      </Dialog> 

      {/* Main content */}
      <section className={openTokenDialog ? "blur-sm relative" : "relative"}>
        <div className='flex justify-between items-center mb-8'>
          <h2 className="text-3xl font-extrabold text-slate-900">Patient Vitals</h2>
          <Button onClick={handleAddVitals} className='cursor-pointer'>
            Add Vitals
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

      {/* History */}
      <section className="mt-12">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-6">History</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Date & Time</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Blood Pressure</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Pulse</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">SpO2</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Temp</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Weight/Height</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetching ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Loading history...</td>
                </tr>
              ) : history.length > 0 ? (
                history.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(record.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{record.BP?.value1}/{record.BP?.value2} <span className="text-[10px] text-slate-400 font-normal">mmHg</span></td>
                    <td className="px-6 py-4 text-sm text-slate-700">{record.PulseRate} <span className="text-xs text-slate-400">bpm</span></td>
                    <td className="px-6 py-4 text-sm text-slate-700">{record.Spo2}%</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{record.Temperature}°C</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.Weight}kg / {record.Height}ft</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No history found for this patient session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default page