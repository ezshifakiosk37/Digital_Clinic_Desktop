'use client'
import React, { useCallback, useEffect, useState } from 'react'
import VitalCard from './_components/VitalCard'
import { VitalType } from '@/app/_utils/types'
import { Button } from '@/components/ui/button'
import { apiService } from '@/app/_utils/apiService'

const page = () => {
  const [vitals, setVitals] = useState({
    BP: {
      value1: '120',
      value2: '80'
    },
    PulseRate: "90",
    Temperature: '37',
    Spo2: '93',
    Height: "5.6",
    Weight: "65"
  });
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([]);
  const [fetching, setFetching] = useState(true);

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


  // Generic updater for single values
  const handleUpdate = (type: keyof typeof vitals, val: string) => {
    setVitals(prev => ({ ...prev, [type]: val }));
  };

  // Specific updater for Blood Pressure (Dual Values)
  const handleBPUpdate = (field: 'value1' | 'value2', val: string) => {
    setVitals(prev => ({
      ...prev,
      BP: {
        ...prev.BP,
        [field]: val
      }
    }));
  };

  // const handleAddVitals = async () => {
  //   const patientId = localStorage.getItem("localClinic_entryId");

  //   if (!patientId) {
  //     alert("No patient found. Please select a patient first.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await fetch('/api/save-vitals', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         patientId,
  //         vitals // This matches the body structure your API expects
  //       }),
  //     });

  //     const result = await response.json();

  //     if (!response.ok) throw new Error(result.error || "Failed to save");

  //     alert("Vitals added successfully!");
  //     // Optional: Reset form or redirect
  //   } catch (error: any) {
  //     console.error("Save Error:", error);
  //     alert(error.message || "Something went wrong");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAddVitals = async () => {
    // Logic: Identify who these vitals belong to.
    const patientId = localStorage.getItem("localClinic_entryId");

    if (!patientId) {
      alert("No active patient session. Please search for a patient or create a new entry first.");
      return;
    }

    setLoading(true);
    try {
      // Logic: 'vitals' here is your local state object: 
      // { BP: {value1, value2}, PulseRate, Spo2, etc. }
      const result = await apiService.saveVitals(patientId, vitals);

      // Logic: apiService.handleResponse throws if success is false, 
      // but checking result.success is good defensive programming.
      if (result.success) {
        alert("Vitals recorded successfully!");

        // Logic: Reset state so the UI doesn't show old data for the next entry
        setVitals({
          BP: { value1: '', value2: '' },
          PulseRate: "",
          Temperature: '',
          Spo2: '',
          Height: "",
          Weight: ""
        });
      }
    } catch (error: any) {
      // Brutal Reality: If this still says "Internal Server Error", 
      // it means your backend crashed on a null value or a schema mismatch.
      console.error("Vitals Submission Error:", error);
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, handleAddVitals]);


  return (
    <div className=" pr-6 py-12">
      <section>
        <div className='flex justify-between items-center mb-8'>
          <h2 className="text-3xl font-extrabold  text-slate-900">Patient Vitals</h2>
          <Button onClick={handleAddVitals} className='cursor-pointer'>
            Add Vitals
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <VitalCard
            type={VitalType.PULSE_RATE}
            onChange={(val) => handleUpdate('PulseRate', val)}
            value={vitals.PulseRate}
          />
          <VitalCard
            type={VitalType.BLOOD_PRESSURE}
            onChange1={(val) => handleBPUpdate('value1', val)}
            onChange2={(val) => handleBPUpdate('value2', val)}
            isDualValue
            value1={vitals.BP.value1}
            value2={vitals.BP.value2}
          />
          <VitalCard
            type={VitalType.TEMPERATURE}
            onChange={(val) => handleUpdate('Temperature', val)}
            value={vitals.Temperature}
          />
          <VitalCard
            type={VitalType.BLOOD_OXYGEN}
            onChange={(val) => handleUpdate('Spo2', val)}
            value={vitals.Spo2}
          />
          <VitalCard
            type={VitalType.WEIGHT}
            onChange={(val) => handleUpdate('Weight', val)}
            value={vitals.Weight}
          />
          <VitalCard
            type={VitalType.HEIGHT}
            onChange={(val) => handleUpdate('Height', val)}
            value={vitals.Height}
          />
        </div>
      </section>

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
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(record.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {record.BP?.value1}/{record.BP?.value2} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{record.PulseRate} <span className="text-xs text-slate-400">bpm</span></td>
                    <td className="px-6 py-4 text-sm text-slate-700">{record.Spo2}%</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{record.Temperature}°C</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.Weight}kg / {record.Height}ft
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No history found for this patient session.
                  </td>
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
