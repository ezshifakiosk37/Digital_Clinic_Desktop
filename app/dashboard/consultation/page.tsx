// consultation/page.tsx
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, CheckCircle, Clock, Search, X, Video } from 'lucide-react';
import { apiService } from '@/app/_utils/apiService';

import Navbar from './components/Navbar';
import DocConsult from './doc_consult';
import DocProfile from './docProfile';
import DocLogout from './docLogout';

import DocSignin from './docSignin';
import DocSignup from './docSignup';

import { DoctorProfile } from './doctor_registration';
import { useCallQueue } from '@/app/_context/CallQueueContext';

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
  // const [tokenSearch, setTokenSearch] = useState('');
  // const [tokenEditMode, setTokenEditMode] = useState(false);
  const [walkinSearchInput, setWalkinSearchInput] = useState('');
  const [walkinSearchResult, setWalkinSearchResult] = useState<any | null>(null);
  const [walkinSearching, setWalkinSearching] = useState(false);
  const [walkinSearchError, setWalkinSearchError] = useState('');
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
  const [globalDoneTokens, setGlobalDoneTokens] = useState<Set<string>>(new Set());
  const [endingSession, setEndingSession] = useState(false);
  const [doctorStatus, setDoctorStatus] = useState<'online' | 'offline'>('online');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [queueTab, setQueueTab] = useState<'Walk-in' | 'Online Consultation'>('Walk-in');
  const [logoutModalMode, setLogoutModalMode] = useState<'offline' | 'logout'>('logout');

  // ── Call Queue Context ──────────────────────────────────────────────────────
  const { onlineQueue: fcmOnlineQueue, removeCall } = useCallQueue();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile>({
    title: '', firstName: '', lastName: '', email: '', password: '',
    phone: '', gender: '', specializations: [], qualifications: [],
    experience: '', city: '', photo: '',
  });

  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // ── Auth check ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const token = localStorage.getItem('doc_token');
    if (token) {
      setIsLoggedIn(true);
    }

    const savedDoctor = apiService.getDoctor();
    if (savedDoctor) {
      setDoctor(savedDoctor);
      // Don't trust localStorage for status — fetch live from server below
    }
    setAuthChecked(true);
  }, []);

  // ── Load dashboard data ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingQueue(true);
      try {
        // Fetch live doctor status from server on every mount/tab switch
        try {
          const profileRes = await apiService.docGetProfile();
          if (profileRes.success && profileRes.doctor) {
            setDoctorStatus(profileRes.doctor.doctorStatus as 'online' | 'offline');
            // Also keep local doctor state fresh (but don't write to localStorage)
            setDoctor(prev => ({ ...prev, ...profileRes.doctor }));
          }
        } catch (profileErr) {
          console.error("Failed to fetch live doctor status", profileErr);
        }

        const savedDoctor = apiService.getDoctor();
        const docId = savedDoctor?.id as string | undefined;

        const stats = await apiService.getTodayStats(docId);
        setTodayStats(stats);

        // Fetch completed tokens globally (no doctorId) to correctly exclude
        // patients who were seen by ANY doctor today
        const globalData = await apiService.getTodayQueue();
        const data = await apiService.getTodayQueue(docId);

        if (data.success && globalData.success) {
          const dedupeById = (arr: any[]) => {
            const seen = new Set();
            return arr.filter((p: any) => {
              if (seen.has(p.id)) return false;
              seen.add(p.id);
              return true;
            });
          };
          const dedupeByPrescription = (arr: any[]) => {
            const seen = new Set();
            return arr.filter((p: any) => {
              const key = p.prescriptionId || `${p.id}-${p.token}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          };

          // Build a set of tokens that are fully done globally (any doctor)
          const globallyDoneTokens = new Set<string>(
            (globalData.completed || []).map((p: any) => String(p.token))
          );

          // Active queue: only patients not done by any doctor
          const activePatients = dedupeById(data.patients || []).filter(
            (p: any) => !globallyDoneTokens.has(String(p.token))
          );

          setQueue(activePatients);
          setDoneQueue(dedupeByPrescription(data.completed || []));
          setGlobalDoneTokens(globallyDoneTokens);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
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

  // ── Doctor login event ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const handleDoctorLogin = () => {
      const savedDoctor = apiService.getDoctor();
      if (savedDoctor) setDoctor(savedDoctor);
    };
    window.addEventListener('doctorLoggedIn', handleDoctorLogin);
    return () => window.removeEventListener('doctorLoggedIn', handleDoctorLogin);
  }, []);

  // ── Sidebar sign-out event (doctor) ────────────────────────────────────────
  React.useEffect(() => {
    const handleSidebarLogout = () => {
      setLogoutModalMode('logout');
      setShowLogoutModal(true);
    };
    window.addEventListener('doctor-logout-requested', handleSidebarLogout);
    return () => window.removeEventListener('doctor-logout-requested', handleSidebarLogout);
  }, []);

  // ── Sidebar profile event (doctor) ─────────────────────────────────────────
  React.useEffect(() => {
    const handleSidebarProfile = () => {
      setActivePage('profile');
      setSelectedPatient(null);
    };
    window.addEventListener('doctor-show-profile', handleSidebarProfile);
    return () => window.removeEventListener('doctor-show-profile', handleSidebarProfile);
  }, []);

  // ── Sidebar dashboard event (doctor) ───────────────────────────────────────
  React.useEffect(() => {
    const handleSidebarDashboard = () => {
      setActivePage('dashboard');
      setSelectedPatient(null);
    };
    window.addEventListener('doctor-show-dashboard', handleSidebarDashboard);
    return () => window.removeEventListener('doctor-show-dashboard', handleSidebarDashboard);
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

  // Merge API queue with live FCM online calls (deduped by vitalsId)
  // Walk-in queue: DB patients only, strip out any online patientType records
  const walkInQueue = queue.filter(
    (p: any) => !p.patientType || p.patientType === 'Walk-in'
  );

  // Online queue: FCM only — never from DB patientType
  const onlineFcmQueue = fcmOnlineQueue
    .filter((fcmCall: any) => !globalDoneTokens.has(String(fcmCall.token)))
    .map((fcmCall: any) => ({
      id: fcmCall.vitalsId,
      vitalsId: fcmCall.vitalsId,
      token: fcmCall.token || '—',
      symptoms: fcmCall.symptoms || fcmCall.body || '—',
      firstName: fcmCall.title || 'Online',
      lastName: 'Patient',
      patientType: 'Online Consultation',
      callUrl: fcmCall.callUrl,
      _isFcmCall: true,
    }));

  const mergedQueue = [...walkInQueue, ...onlineFcmQueue];

  const walkInCount = mergedQueue.filter(p => !p.patientType || p.patientType === 'Walk-in').length;
  const onlineCount = mergedQueue.filter(p => p.patientType === 'Online Consultation').length;

  const filteredQueue = mergedQueue.filter(p => {
    const type = p.patientType as string | undefined;
    const matchesTab =
      queueTab === 'Online Consultation'
        ? type === 'Online Consultation'
        : !type || type === 'Walk-in';
    return matchesTab;
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleWalkinTokenSearch = async () => {
    const token = walkinSearchInput.trim();
    if (!token) return;
    setWalkinSearching(true);
    setWalkinSearchError('');
    setWalkinSearchResult(null);
    try {
      const res = await apiService.verifyToken(token);
      if (res.success) {
        // Get full patient info from today's queue
        const queueRes = await apiService.getTodayQueue();
        const allPatients: any[] = queueRes.patients ?? [];
        const found = allPatients.find(
          (p: any) => String(p.token).toLowerCase() === token.toLowerCase()
        );
        if (found) {
          setWalkinSearchResult(found);
        } else {
          setWalkinSearchError('Patient found but vitals not recorded yet.');
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already used')) {
        setWalkinSearchError('This token has already been used today.');
      } else {
        setWalkinSearchError('Invalid or expired token for today.');
      }
    } finally {
      setWalkinSearching(false);
    }
  };

  const handleStartConsult = async (patient: any) => {
    if (patient._isFcmCall) {
      try {
        const res = await apiService.acceptCall(patient.vitalsId);
        if (res.success) {
          removeCall(patient.vitalsId);
          window.location.href = patient.callUrl;
        }
      } catch (err) {
        console.error("Failed to accept online call:", err);
      }
      return;
    }
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
    try {
      const savedDoctor = apiService.getDoctor();
      const docId = savedDoctor?.id as string | undefined;
      const stats = await apiService.getTodayStats(docId);
      setTodayStats(stats);
    } catch (err) {
      console.error("Failed to refresh stats", err);
    }
  };

  const handleLogoutClick = () => {
    setLogoutModalMode('logout');
    setShowLogoutModal(true);
  };
  const confirmLogout = async () => {
    if (!selectedLogoutReason) return;
    setLogoutLoading(true);

    try {
      if (logoutModalMode === 'offline') {
        // Just going offline — stay logged in
        await apiService.updateDoctorStatus('offline', selectedLogoutReason);
        setDoctorStatus('offline');
        setShowLogoutModal(false);
        setSelectedLogoutReason('');
      } else {
        // Full logout
        if (window.AndroidNative && typeof window.AndroidNative.unregisterFcmDevice === 'function') {
          try { window.AndroidNative.unregisterFcmDevice(); } catch { }
        }
        await apiService.updateDoctorStatus('offline', selectedLogoutReason);
        await fetch(`${API_BASE_URL}/api/doctors/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('doc_token')}`,
          },
          body: JSON.stringify({ reason: selectedLogoutReason }),
        });
        // Doctor logout — only clear doctor tokens, never touch staff token
        localStorage.removeItem('doc_token');
        localStorage.removeItem('doctor');
        setShowLogoutModal(false);
        setIsLoggedIn(false);
        setSelectedLogoutReason('');
        setSelectedPatient(null);
        setDoctorStatus('offline');
        router.push('/sign-in');
      }
    } catch (err) {
      console.error("Logout/offline error:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setSelectedLogoutReason('');
  };

  const handleToggleStatus = async () => {
    if (doctorStatus === 'online') {
      setLogoutModalMode('offline');
      setShowLogoutModal(true);
      return;
    }
    setTogglingStatus(true);
    try {
      const data = await apiService.updateDoctorStatus('online');
      if (data.success) setDoctorStatus(data.doctorStatus);
    } catch (err) {
      console.error("Status toggle failed", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  // ── Auth gates ──────────────────────────────────────────────────────────────
  // if (!isLoggedIn) {
  //   return activePage === 'login'
  //     ? <DocSignin setActivePage={setActivePage} setIsLoggedIn={setIsLoggedIn} />
  //     : <DocSignup setActivePage={setActivePage} />;
  // }
  // ── Auth gate — doctor must be logged in via main sign-in ───────────────────
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <p className="text-slate-500 font-medium">Session expired. Please sign in again.</p>
          <button
            onClick={() => { window.location.href = '/sign-in'; }}
            className="px-6 py-2.5 bg-[#0297d6] text-white rounded-xl font-bold"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-white text-sm">
      <Navbar
        fullName={fullName}
        doctorPhoto={doctor.photo}
        onProfileClick={() => setActivePage('profile')}
        onLogoutClick={handleLogoutClick}
        doctorStatus={doctorStatus}
        togglingStatus={togglingStatus}
        onToggleStatus={handleToggleStatus}
        onMenuClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
      />

      <main className="max-w-7xl mx-auto p-3 md:p-6 pb-6">

        {/* ── Dashboard ── */}
        {activePage === 'dashboard' && !selectedPatient && (
          <div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
              {[
                { label: 'TODAY PATIENTS', val: todayStats.todayPatients, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'IN QUEUE', val: todayStats.inQueue, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'COMPLETED', val: todayStats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 flex flex-col md:flex-row items-center gap-2 md:gap-5 shadow-sm border border-slate-100">
                  <div className={`w-8 h-8 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    <s.icon size={18} className="md:hidden" />
                    <s.icon size={32} className="hidden md:block" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[9px] md:text-sm font-semibold text-slate-500 tracking-widest uppercase leading-tight">{s.label}</p>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-800 mt-0.5 md:mt-1">{s.val}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Patient Queue */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">

              {/* Queue header + tab switcher */}
              <div className="px-8 py-5 border-b flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-bold text-xl text-slate-800">CURRENT PATIENT QUEUE</h2>
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  {(['Walk-in', 'Online Consultation'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setQueueTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${queueTab === tab
                        ? 'bg-white text-[#0297d6] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {tab === 'Walk-in'
                        ? `🏥 Walk-in (${walkInCount})`
                        : `💻 Online (${onlineCount})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Walk-in: token lookup from DB */}
              {queueTab === 'Walk-in' && (
                <div className="px-8 py-5 border-b border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-full max-w-sm">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={walkinSearchInput}
                        onChange={e => {
                          setWalkinSearchInput(e.target.value);
                          setWalkinSearchResult(null);
                          setWalkinSearchError('');
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleWalkinTokenSearch()}
                        placeholder="Enter patient token number..."
                        className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0297d6] focus:ring-2 focus:ring-[#0297d6]/10"
                      />
                      {walkinSearchInput && (
                        <button
                          onClick={() => {
                            setWalkinSearchInput('');
                            setWalkinSearchResult(null);
                            setWalkinSearchError('');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleWalkinTokenSearch}
                      disabled={walkinSearching || !walkinSearchInput.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0297d6] hover:bg-[#0286c2] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {walkinSearching
                        ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching</>
                        : <><Search size={14} />Find</>}
                    </button>
                  </div>

                  {/* Error */}
                  {walkinSearchError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                      <span className="font-bold">⚠</span> {walkinSearchError}
                    </div>
                  )}

                  {/* Result row */}
                  {walkinSearchResult && (
                    <div className="rounded-xl border border-[#0297d6]/20 bg-[#0297d6]/5 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-[#0297d6]/10">
                          <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-5 py-3">Token</th>
                            <th className="px-5 py-3">Name</th>
                            <th className="px-5 py-3 hidden sm:table-cell">Phone</th>
                            <th className="px-5 py-3">Symptoms</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-5 py-4">
                              <span className="font-black text-[#0297d6] text-sm">#{walkinSearchResult.token}</span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800 text-sm">
                                {walkinSearchResult.firstName} {walkinSearchResult.lastName}
                              </p>
                            </td>
                            <td className="px-5 py-4 hidden sm:table-cell">
                              <p className="text-sm text-slate-500">{walkinSearchResult.phoneNumber || '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-600 max-w-xs truncate">
                                {walkinSearchResult.symptoms || '—'}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => {
                                  handleStartConsult(walkinSearchResult);
                                  setWalkinSearchInput('');
                                  setWalkinSearchResult(null);
                                  setWalkinSearchError('');
                                }}
                                className="bg-[#0297d6] hover:bg-[#0286c2] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all"
                              >
                                START
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Queue table — only rendered for Online tab */}
              {queueTab === 'Online Consultation' && <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-xs text-slate-500 font-black uppercase tracking-widest">
                    <th className="px-8 py-4 text-left">Sr.</th>
                    <th className="px-8 py-4 text-left">Token</th>
                    <th className="px-8 py-4 text-left">Name</th>
                    <th className="px-8 py-4 text-left hidden md:table-cell">Phone</th>
                    <th className="px-8 py-4 text-left">Symptoms</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingQueue ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm">
                        Loading queue...
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm">
                        {queueTab === ('Online Consultation' as string)
                          ? 'No online calls yet — patients will appear here when they call.'
                          : 'No patients in walk-in queue.'}
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((p, i) => (
                      <tr
                        key={`${p.id}-${p.token || i}`}
                        className={`hover:bg-slate-50 transition-colors ${p._isFcmCall ? 'bg-blue-50/40' : ''}`}
                      >
                        {/* Sr */}
                        <td className="px-8 py-5 text-sm font-medium text-slate-400">{i + 1}</td>

                        {/* Token */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#0297d6] text-sm">#{p.token}</span>
                            {p._isFcmCall && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                Live
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800 text-sm">
                            {p.firstName} {p.lastName}
                          </p>
                        </td>

                        {/* Phone */}
                        <td className="px-8 py-5 hidden md:table-cell">
                          <p className="text-sm text-slate-500">{p.phoneNumber || '—'}</p>
                        </td>

                        {/* Symptoms */}
                        <td className="px-8 py-5">
                          <p className="text-sm text-slate-600 max-w-xs truncate">{p.symptoms || '—'}</p>
                        </td>

                        {/* Action */}
                        <td className="px-8 py-5 text-right">
                          {p._isFcmCall ? (
                            <button
                              onClick={() => handleStartConsult(p)}
                              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                            >
                              <Video size={15} />
                              JOIN
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartConsult(p)}
                              className="bg-[#0297d6] hover:bg-[#0288c2] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                            >
                              START
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>}
            </div>

            {/* Completed Today */}
            {doneQueue.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
                <div className="px-8 py-5 border-b flex items-center gap-3">
                  <CheckCircle size={20} className="text-blue-700" />
                  <h2 className="font-bold text-xl text-slate-800">COMPLETED TODAY</h2>
                  <span className="ml-auto bg-blue-200 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {doneQueue.length} Done
                  </span>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                      <th className="px-8 py-4 text-left">Sr. No</th>
                      <th className="px-8 py-4 text-left">Token</th>
                      <th className="px-8 py-4 text-left">Patient</th>
                      <th className="px-8 py-4 text-left">Symptoms</th>
                      <th className="px-8 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doneQueue.map((p, i) => (
                      <tr key={`done-${p.prescriptionId}`} className="bg-emerald-50/30">
                        <td className="px-8 py-4 font-medium text-slate-400">{i + 1}</td>
                        <td className="px-8 py-4 font-bold text-slate-400">#{p.token}</td>
                        <td className="px-8 py-4 text-slate-600 font-semibold">{p.firstName} {p.lastName}</td>
                        <td className="px-8 py-4 text-slate-500 text-sm">{p.symptoms || '—'}</td>
                        <td className="px-4 py-4 text-right">
                          <span className="bg-blue-200 text-blue-700 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
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

      </main>

      {/* ── Patient Consultation — full width, outside main padding ── */}
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

      {/* ── Profile — full width, outside main padding ── */}
      {activePage === 'profile' && (
        <DocProfile
          setActivePage={setActivePage}
          doctor={doctor}
          setDoctor={setDoctor}
          editMode={editMode}
          setEditMode={setEditMode}
        />
      )}

      <DocLogout
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        selectedLogoutReason={selectedLogoutReason}
        setSelectedLogoutReason={setSelectedLogoutReason}
        confirmLogout={confirmLogout}
        cancelLogout={cancelLogout}
        logoutLoading={logoutLoading}
        mode={logoutModalMode}
      />
    </div>
  );
};

export default EZShifaPortal;