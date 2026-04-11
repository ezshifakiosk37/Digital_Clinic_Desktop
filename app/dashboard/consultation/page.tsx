// consultation/page.tsx
"use client";
import React, { useState } from 'react';
import { User, CheckCircle, Clock, Search, X } from 'lucide-react';
import { apiService } from '@/app/_utils/apiService';

import Navbar from './components/Navbar';
import DocConsult from './doc_consult';
import DocProfile from './docProfile';
import DocLogout from './docLogout';
import DocSignin from './docSignin';
import DocSignup from './docSignup';

import { DoctorProfile } from './doctor_registration';

const API_BASE_URL = "https://bifurcation-clinic-api.vercel.app";

interface Vitals {
  temp: string;
  bp: string;
  pulse: string;
  weight: string;
}

interface Patient {
  id: number;
  token: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  symptoms: string;
  medicalHistory: string;
  vitals: Vitals;
}

const EZShifaPortal = () => {
  const [activePage, setActivePage] = useState<'login' | 'signup' | 'dashboard' | 'profile'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenEditMode, setTokenEditMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedLogoutReason, setSelectedLogoutReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
  const [todayStats, setTodayStats] = useState({ todayPatients: 0, inQueue: 0, completed: 0 });
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [doneQueue, setDoneQueue] = useState<any[]>([]);
  const [endingSession, setEndingSession] = useState(false);


  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev =>
      prev.map(m => m.id === id ? { ...m, [field]: value } : m)
    );
  };


  const [doctor, setDoctor] = useState<DoctorProfile>({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    specializations: [],
    qualifications: [],
    experience: '',
    city: '',
    photo: '',
  });
  
React.useEffect(() => {
    const token = localStorage.getItem('doc_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setActivePage('login');
    }

    const savedDoctor = apiService.getDoctor();
    if (savedDoctor) {
      setDoctor(savedDoctor);
    }

    setAuthChecked(true);
  }, []);

  // Load today's stats and queue when component mounts or doctor logs in
  // Load today's stats and queue (ONLY today's patients)
  React.useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingQueue(true);
      try {
        // Get stats
        const stats = await apiService.getTodayStats();
        setTodayStats(stats);

        // Get only today's patients for queue
        const response = await fetch(`${API_BASE_URL}/api/patients/today-queue`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('doc_token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch queue');

        const data = await response.json();
        if (data.success) {
          const dedupe = (arr: any[]) => {
            const seen = new Set();
            return arr.filter((p: any) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
          };
          setQueue(dedupe(data.patients || []));
          setDoneQueue(dedupe(data.completed || []));
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        // Optional: show user-friendly message
        // setError("Failed to load queue. Please refresh.");
      } finally {
        setLoadingQueue(false);
      }
    };

    if (isLoggedIn && localStorage.getItem('doc_token')) {
      loadDashboardData();
    } else if (!localStorage.getItem('doc_token')) {
      setIsLoggedIn(false);
      setActivePage('login');
    }
  }, [isLoggedIn]);


  // Fix for immediate doctor update after login
  React.useEffect(() => {
    const handleDoctorLogin = () => {
      const savedDoctor = apiService.getDoctor();
      if (savedDoctor) {
        setDoctor(savedDoctor);
      }
    };

    window.addEventListener('doctorLoggedIn', handleDoctorLogin);
    return () => window.removeEventListener('doctorLoggedIn', handleDoctorLogin);
  }, []);

  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

  // const queue: Patient[] = [
  //   {
  //     id: 1, token: '101', firstName: 'Ahmed', lastName: 'Khan', age: 45, gender: 'Male',
  //     symptoms: 'Persistent Cough, Fever', medicalHistory: 'Type 2 Diabetes',
  //     vitals: { temp: '101.2°F', bp: '130/85', pulse: '88 bpm', weight: '75kg' },
  //   },
  //   {
  //     id: 2, token: '102', firstName: 'Sara', lastName: 'Ahmed', age: 29, gender: 'Female',
  //     symptoms: 'Severe Headache', medicalHistory: 'Migraine',
  //     vitals: { temp: '98.4°F', bp: '110/70', pulse: '72 bpm', weight: '60kg' },
  //   },
  // ];

  const filteredQueue = queue.filter(p =>
    !tokenSearch || String(p.token || '').toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const handleStartConsult = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleSessionEnd = async (completedPatient: any) => {
    setQueue(prev => prev.filter(p => p.id !== completedPatient.id));
    setDoneQueue(prev => [...prev, completedPatient]);
    setSelectedPatient(null);
    setMedicines([]);
    setNotes('');
    setPrescriptionGenerated(false);
    setEndingSession(false);

    // Re-fetch accurate stats from API instead of guessing locally
    try {
      const stats = await apiService.getTodayStats();
      setTodayStats(stats);
    } catch (err) {
      console.error("Failed to refresh stats", err);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    if (!selectedLogoutReason) return;

    setLogoutLoading(true);

    try {
      await fetch(`${API_BASE_URL}/api/doctors/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('doc_token')}`,
        },
        body: JSON.stringify({ reason: selectedLogoutReason }),
      });

      localStorage.removeItem('doc_token');
      localStorage.removeItem('doctor');

      setShowLogoutModal(false);
      setIsLoggedIn(false);
      setActivePage('login');
      setSelectedLogoutReason('');
      setSelectedPatient(null);
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('doc_token');
      localStorage.removeItem('doctor');
      setShowLogoutModal(false);
      setIsLoggedIn(false);
      setActivePage('login');
    } finally {
      setLogoutLoading(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setSelectedLogoutReason('');

  };


  if (!isLoggedIn) {
    if (activePage === 'login') {
      return <DocSignin setActivePage={setActivePage} setIsLoggedIn={setIsLoggedIn} />;
    } else {
      return <DocSignup setActivePage={setActivePage} />;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar
        fullName={fullName}
        doctorPhoto={doctor.photo}
        onProfileClick={() => setActivePage('profile')}
        onLogoutClick={handleLogoutClick}
      />

      <main className="max-w-7xl mx-auto p-6">
        {/* Dashboard - Queue View */}
        {activePage === 'dashboard' && !selectedPatient && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'TODAY PATIENTS', val: todayStats.todayPatients, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'IN QUEUE', val: todayStats.inQueue, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'COMPLETED', val: todayStats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-sm border border-slate-100">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    <s.icon size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 tracking-widest uppercase">{s.label}</p>
                    <h3 className="text-4xl font-black text-slate-800 mt-1">{s.val}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Patient Queue */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="px-8 py-5 border-b">
                <h2 className="font-bold text-xl text-slate-800">CURRENT PATIENT QUEUE</h2>
              </div>

              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-sm text-slate-500 font-semibold">
                    <th className="px-8 py-4 text-left">SR. NO</th>
                    <th className="px-8 py-4 text-left">
                      Token Number
                      {tokenEditMode ? (
                        <div className="inline-flex items-center ml-3">
                          <input
                            autoFocus
                            type="text"
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            placeholder="Search..."
                            className="bg-white border border-[#0297d6] rounded px-3 py-1 text-sm w-40 focus:outline-none"
                          />
                          <button
                            onClick={() => { setTokenSearch(''); setTokenEditMode(false); }}
                            className="ml-2 text-slate-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTokenEditMode(true)}
                          className="ml-2 hover:text-[#0297d6]"
                        >
                          <Search size={16} />
                        </button>
                      )}
                    </th>
                    <th className="px-8 py-4 text-left">SYMPTOMS</th>
                    <th className="px-8 py-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredQueue.map((p, i) => (
                    <tr key={`${p.id}-${p.token || i}`} className="hover:bg-slate-50">
                      <td className="px-8 py-5 font-medium text-slate-600">{i + 1}</td>
                      <td className="px-8 py-5 font-bold text-[#0297d6]">#{p.token}</td>
                      <td className="px-8 py-5 text-slate-700">{p.symptoms}</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleStartConsult(p)}
                          className="bg-[#0297d6] hover:bg-[#0288c2] text-white px-8 py-2.5 rounded-xl text-sm font-bold tracking-widest transition-all"
                        >
                          START
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Done Queue */}
            {doneQueue.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
                <div className="px-8 py-5 border-b flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500" />
                  <h2 className="font-bold text-xl text-slate-800">COMPLETED TODAY</h2>
                  <span className="ml-auto bg-emerald-50 text-emerald-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {doneQueue.length} Done
                  </span>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-sm text-slate-500 font-semibold">
                      <th className="px-8 py-4 text-left">SR. NO</th>
                      <th className="px-8 py-4 text-left">TOKEN</th>
                      <th className="px-8 py-4 text-left">PATIENT</th>
                      <th className="px-8 py-4 text-left">SYMPTOMS</th>
                      <th className="px-8 py-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {doneQueue.map((p, i) => (
                      <tr key={`done-${p.id}`} className="bg-emerald-50/30">
                        <td className="px-8 py-4 font-medium text-slate-400">{i + 1}</td>
                        <td className="px-8 py-4 font-bold text-slate-400">#{p.token}</td>
                        <td className="px-8 py-4 text-slate-600 font-semibold">{p.firstName} {p.lastName}</td>
                        <td className="px-8 py-4 text-slate-500 text-sm">{p.symptoms || '—'}</td>
                        <td className="px-8 py-4 text-right">
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
                            ✓ Done
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Patient Consultation */}
        {selectedPatient && activePage === 'dashboard' && (
          <DocConsult
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            medicines={medicines}
            setMedicines={setMedicines}
            notes={notes}
            setNotes={setNotes}
            prescriptionGenerated={prescriptionGenerated}
            setPrescriptionGenerated={setPrescriptionGenerated}
            doctor={doctor}
            updateMedicine={updateMedicine}
            fullName={fullName}
            onSessionEnd={handleSessionEnd}
            endingSession={endingSession}
            setEndingSession={setEndingSession}
          />
        )}

        {/* Profile Page */}
        {activePage === 'profile' && (
          <DocProfile
            setActivePage={setActivePage}
            doctor={doctor}
            setDoctor={setDoctor}
            editMode={editMode}
            setEditMode={setEditMode}
          />
        )}
      </main>

      {/* Logout Modal - Full props */}
      <DocLogout
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        selectedLogoutReason={selectedLogoutReason}
        setSelectedLogoutReason={setSelectedLogoutReason}
        confirmLogout={confirmLogout}
        cancelLogout={cancelLogout}
        logoutLoading={logoutLoading}
      />
    </div>
  );
};

export default EZShifaPortal;