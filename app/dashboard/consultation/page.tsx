"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, CheckCircle, Clock, Search, X, Video } from 'lucide-react';

import { apiService } from '@/app/_utils/apiService';
import Navbar from './components/Navbar';
import DocConsult from './doc_consult';
import DocProfile from './docProfile';
import DocLogout from './docLogout';
import { CallStatusBadge } from './components/CallStatusBadge';
import { DoctorProfile } from './doctor_registration';
import { useCallQueue } from '@/app/_context/CallQueueContext';

interface Vitals { temp: string; bp: string; pulse: string; weight: string; }
interface Patient {
  id: number; token: string; firstName: string; lastName: string;
  age: number; gender: string; symptoms: string; medicalHistory: string; vitals: Vitals;
}

const EZShifaPortal = () => {

  // ── State ──────────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<'login' | 'signup' | 'dashboard' | 'profile' | 'consult'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [walkinSearchInput, setWalkinSearchInput] = useState('');
  const [walkinSearchResult, setWalkinSearchResult] = useState<any | null>(null);
  const [walkinSearching, setWalkinSearching] = useState(false);
  const [walkinSearchError, setWalkinSearchError] = useState('');

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedLogoutReason, setSelectedLogoutReason] = useState('');
  const [logoutModalMode, setLogoutModalMode] = useState<'offline' | 'logout'>('logout'); // ✅ single declaration (was duplicated in conflict)
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const [todayStats, setTodayStats] = useState({ todayPatients: 0, inQueue: 0, completed: 0 });
  const [queue, setQueue] = useState<any[]>([]);
  const [doneQueue, setDoneQueue] = useState<any[]>([]);
  const [globalDoneTokens, setGlobalDoneTokens] = useState<Set<string>>(new Set());
  const [loadingQueue, setLoadingQueue] = useState(false);

  const [doctorStatus, setDoctorStatus] = useState<'online' | 'offline'>('online');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [queueTab, setQueueTab] = useState<'Walk-in' | 'Online Consultation'>('Walk-in');

  // ✅ NEW from 32c8f8a — gates the status dispatch so layout never gets the default 'online' too early
  const [profileLoaded, setProfileLoaded] = useState(false);

  // NOTE: isFirstStatusDispatch ref was in the incoming branch but unused in final logic;
  // keeping it commented in case you need it for future guard logic
  // const isFirstStatusDispatch = useRef(true);

  const [doctor, setDoctor] = useState<DoctorProfile>({
    title: '', firstName: '', lastName: '', email: '', password: '',
    phone: '', gender: '', specializations: [], qualifications: [],
    experience: '', city: '', photo: '',
  });

  // ── Router + Call Queue Context ────────────────────────────────────────────
  // ✅ Single router declaration (was duplicated in conflict)
  const router = useRouter();

  // ✅ updateCallStatus included (from 32c8f8a — needed for the polling useEffect)
  const { onlineQueue: fcmOnlineQueue, removeCall, updateCallStatus } = useCallQueue();

  // ── Auth + dashboard data load ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('doc_token');
    console.log("[Auth] doc_token present:", !!token);

    if (!token) {
      setAuthChecked(true);
      return; // isLoggedIn stays false → session expired screen
    }

    console.log("Doc Token:", token);
    setIsLoggedIn(true);

    const savedDoctor = apiService.getDoctor();
    if (savedDoctor) setDoctor(savedDoctor);
    setAuthChecked(true);

    const loadDashboardData = async () => {
      console.log("[Dashboard] Loading dashboard data...");
      setLoadingQueue(true);
      try {
        // Profile MUST resolve before anything else so the dispatch
        // useEffect fires with the real status, not the default 'online'
        try {
          const profileRes = await apiService.docGetProfile();
          if (profileRes.success && profileRes.doctor) {
            console.log("[Dashboard] Live doctor status:", profileRes.doctor.doctorStatus);
            setDoctorStatus(profileRes.doctor.doctorStatus as 'online' | 'offline');
            setDoctor(prev => ({ ...prev, ...profileRes.doctor }));
          }
        } catch (profileErr) {
          console.error("[Dashboard] Failed to fetch live doctor profile:", profileErr);
        } finally {
          setProfileLoaded(true); // ✅ unblocks dispatch useEffect with real status
        }

        const docId = savedDoctor?.id as string | undefined;
        console.log("[Dashboard] Doctor ID:", docId);

        const [stats, globalData, data] = await Promise.all([
          apiService.getTodayStats(docId),
          apiService.getTodayQueue(),
          apiService.getTodayQueue(docId),
        ]);

        console.log("[Dashboard] Stats:", stats);
        setTodayStats(stats);

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

          const globallyDoneTokens = new Set<string>(
            (globalData.completed || []).map((p: any) => String(p.token))
          );
          console.log("[Dashboard] Globally done tokens:", globallyDoneTokens.size);

          const activePatients = dedupeById(data.patients || []).filter(
            (p: any) => !globallyDoneTokens.has(String(p.token))
          );
          console.log("[Dashboard] Active walk-in queue:", activePatients.length);

          setQueue(activePatients);
          setDoneQueue(dedupeByPrescription(data.completed || []));
          setGlobalDoneTokens(globallyDoneTokens);
        }
      } catch (err) {
        console.error("[Dashboard] Failed to load dashboard data:", err);
      } finally {
        setLoadingQueue(false);
      }
    };

    loadDashboardData();
  }, []);

  // ── Dispatch real doctor status to layout (FCM registration) ──────────────
  // ✅ NEW from 32c8f8a — Gated on BOTH authChecked AND profileLoaded so the
  // layout never receives the default 'online' value; always gets real API value first.
  useEffect(() => {
    if (!authChecked || !profileLoaded) return;

    console.log("[DoctorStatus] Dispatching real status to layout:", doctorStatus);
    window.dispatchEvent(
      new CustomEvent('doctor-status-changed', { detail: { status: doctorStatus } })
    );
  }, [doctorStatus, authChecked, profileLoaded]);

  // ── Doctor login event (fired after login flow completes) ──────────────────
  useEffect(() => {
    const handleDoctorLogin = () => {
      console.log("[Auth] doctorLoggedIn event received");
      const savedDoctor = apiService.getDoctor();
      if (savedDoctor) setDoctor(savedDoctor);
    };
    window.addEventListener('doctorLoggedIn', handleDoctorLogin);
    return () => window.removeEventListener('doctorLoggedIn', handleDoctorLogin);
  }, []);

  // ── Sidebar event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const onLogout = () => { setLogoutModalMode('logout'); setShowLogoutModal(true); };
    const onProfile = () => { setActivePage('profile'); setSelectedPatient(null); };
    const onDashboard = () => { setActivePage('dashboard'); setSelectedPatient(null); };

    window.addEventListener('doctor-logout-requested', onLogout);
    window.addEventListener('doctor-show-profile', onProfile);
    window.addEventListener('doctor-show-dashboard', onDashboard);
    return () => {
      window.removeEventListener('doctor-logout-requested', onLogout);
      window.removeEventListener('doctor-show-profile', onProfile);
      window.removeEventListener('doctor-show-dashboard', onDashboard);
    };
  }, []);

  // ── Poll call status for every live online call every 5s ──────────────────
  // ✅ NEW from 32c8f8a — requires updateCallStatus from useCallQueue
  useEffect(() => {
    if (fcmOnlineQueue.length === 0) return;

    console.log("[Poll] Starting status polling for", fcmOnlineQueue.length, "online call(s)");

    const interval = setInterval(async () => {
      for (const call of fcmOnlineQueue) {
        if (!call.vitalsId) continue;
        try {
          const res = await apiService.getCallStatus(call.vitalsId);
          if (res.success && res.status && res.status !== call.status) {
            console.log(`[Poll] Status changed for vitalsId ${call.vitalsId}: ${call.status} → ${res.status}`);
            updateCallStatus(call.vitalsId, res.status);
          }
        } catch {
          // silent — poll will retry next tick
        }
      }
    }, 5000);

    return () => {
      console.log("[Poll] Clearing status polling interval");
      clearInterval(interval);
    };
  }, [fcmOnlineQueue, updateCallStatus]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

  const walkInQueue = queue.filter(
    (p: any) => !p.patientType || p.patientType === 'Walk-in'
  );

  // Map FCM calls to table row shape, preserving status from context
  const onlineFcmQueue = fcmOnlineQueue
    .filter((fcmCall) => !globalDoneTokens.has(String(fcmCall.token)))
    .map((fcmCall) => ({
      id: fcmCall.vitalsId,
      vitalsId: fcmCall.vitalsId,
      token: fcmCall.token || '—',
      firstName: fcmCall.title || 'Online',
      lastName: 'Patient',
      phoneNumber: null,
      symptoms: fcmCall.symptoms || fcmCall.body || '—',
      patientType: 'Online Consultation',
      callUrl: fcmCall.callUrl,
      status: fcmCall.status, // ✅ preserved from context so polling updates reflect here
      _isFcmCall: true,
    }));

  const walkInCount = walkInQueue.length;
  const onlineCount = onlineFcmQueue.length;

  const filteredQueue = queueTab === 'Online Consultation' ? onlineFcmQueue : walkInQueue;
  console.log(filteredQueue);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleWalkinTokenSearch = async () => {
    const token = walkinSearchInput.trim();
    if (!token) return;

    console.log("[WalkIn] Searching for token:", token);
    setWalkinSearching(true);
    setWalkinSearchError('');
    setWalkinSearchResult(null);

    try {
      if (globalDoneTokens.has(String(token))) {
        setWalkinSearchError('This token has already been consulted today.');
        return;
      }

      const res = await apiService.verifyToken(token);
      if (res.success) {
        const queueRes = await apiService.getTodayQueue();

        const freshDoneTokens = new Set<string>(
          (queueRes.completed || []).map((p: any) => String(p.token))
        );
        if (freshDoneTokens.has(String(token))) {
          setWalkinSearchError('This token has already been consulted today.');
          return;
        }

        const found = (queueRes.patients ?? []).find(
          (p: any) => String(p.token).toLowerCase() === token.toLowerCase()
        );

        if (found) {
          console.log("[WalkIn] Patient found:", found.firstName, found.lastName);
          setWalkinSearchResult(found);
        } else {
          setWalkinSearchError('Patient found but vitals not recorded yet.');
        }
      }
    } catch (err: any) {
      const msg = err.message || '';
      console.log("[WalkIn] Token search error:", msg);
      setWalkinSearchError(
        msg.toLowerCase().includes('already used')
          ? 'This token has already been used today.'
          : 'Invalid or expired token for today.'
      );
    } finally {
      setWalkinSearching(false);
    }
  };

  const handleStartConsult = async (patient: any) => {
    if (patient._isFcmCall) {
      console.log("[Online] Accepting call for vitalsId:", patient.vitalsId);
      try {
        const res = await apiService.acceptCall(patient.vitalsId);
        if (res.success) {
          console.log("[Online] Call accepted, navigating to:", patient.callUrl);
          removeCall(patient.vitalsId);
          window.location.href = patient.callUrl;
        }
      } catch (err) {
        console.error("[Online] Failed to accept call:", err);
      }
      return;
    }
    console.log("[WalkIn] Starting consult for patient:", patient.firstName, patient.lastName);
    setSelectedPatient(patient);
    setActivePage('consult');
  };

  const handleSessionEnd = async (completedPatient: any) => {
    console.log("[Session] Ending session for:", completedPatient.firstName, completedPatient.lastName);
    setQueue(prev => prev.filter(p => p.id !== completedPatient.id));
    setDoneQueue(prev => [...prev, completedPatient]);
    setSelectedPatient(null);
    setActivePage('dashboard'); 
    setMedicines([]);
    setNotes('');
    setPrescriptionGenerated(false);
    setEndingSession(false);
    try {
      const docId = apiService.getDoctor()?.id as string | undefined;
      const stats = await apiService.getTodayStats(docId);
      setTodayStats(stats);
      console.log("[Session] Stats refreshed after session end:", stats);
    } catch (err) {
      console.error("[Session] Failed to refresh stats:", err);
    }
  };

  const confirmLogout = async () => {
    if (!selectedLogoutReason) return;
    setLogoutLoading(true);
    console.log("[Logout] Mode:", logoutModalMode, "| Reason:", selectedLogoutReason);
    try {
      if (logoutModalMode === 'offline') {
        await apiService.updateDoctorStatus('offline', selectedLogoutReason);
        setDoctorStatus('offline');
        setShowLogoutModal(false);
        setSelectedLogoutReason('');
        console.log("[Logout] Doctor set to offline");
} else {
        // ✅ Clear tokens FIRST before any state/navigation so layout auth check sees empty storage immediately
       // ✅ API calls FIRST (token still in storage so they succeed)
        await apiService.updateDoctorStatus('offline', selectedLogoutReason);
        await apiService.docLogoutWithReason(selectedLogoutReason);
        // ✅ THEN clear tokens — layout auth check will now see empty storage on navigation
        localStorage.removeItem('doc_token');
        localStorage.removeItem('doctor');
        window.dispatchEvent(new CustomEvent('doctor-logged-out'));
        setShowLogoutModal(false);
        setIsLoggedIn(false);
        setSelectedLogoutReason('');
        setSelectedPatient(null);
        setDoctorStatus('offline');
        console.log("[Logout] Doctor logged out, redirecting to sign-in");
        router.replace('/sign-in'); // ✅ replace not push — back button won't return to dashboard
      }
    } catch (err) {
      console.error("[Logout] Error during logout:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (doctorStatus === 'online') {
      setLogoutModalMode('offline');
      setShowLogoutModal(true);
      return;
    }
    console.log("[Status] Toggling doctor status to online");
    setTogglingStatus(true);
    try {
      const data = await apiService.updateDoctorStatus('online');
      if (data.success) {
        console.log("[Status] Doctor now:", data.doctorStatus);

        // Wait for FCM registration to complete before clearing spinner
        await new Promise<void>((resolve) => {
          const onDone = () => {
            window.removeEventListener('fcm-registration-done', onDone);
            resolve();
          };
          const onStart = () => {
            window.removeEventListener('fcm-registration-start', onStart);
            window.addEventListener('fcm-registration-done', onDone);
            // Safety timeout — if FCM takes >10s, unblock anyway
            setTimeout(() => { resolve(); }, 10000);
          };
          window.addEventListener('fcm-registration-start', onStart);
          // If FCM never starts (e.g. already registered), unblock after 1s
          setTimeout(() => { resolve(); }, 1000);

          setDoctorStatus(data.doctorStatus); // triggers dispatch → layout → registerFcm
        });
      }
    } catch (err) {
      console.error("[Status] Toggle failed:", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── Loading guard (while auth is being checked) ────────────────────────────
  // ✅ NEW from 32c8f8a — shows spinner instead of flashing session-expired screen
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="w-7 h-7 border-[3px] border-[#0297d6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Session expired guard ──────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-white text-sm overflow-x-hidden">
      <Navbar
        fullName={fullName}
        doctorPhoto={doctor.photo}
        onProfileClick={() => setActivePage('profile')}
        onLogoutClick={() => { setLogoutModalMode('logout'); setShowLogoutModal(true); }}
        doctorStatus={doctorStatus}
        togglingStatus={togglingStatus}
        onToggleStatus={handleToggleStatus}
        onMenuClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
      />

      {/* ── Dashboard ── */}
      {activePage === 'dashboard' && (
        <main className="max-w-7xl mx-auto p-3 md:p-6 pb-6">

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
                {/* ✅ Stats label + value block — was missing in HEAD conflict (got cut off) */}
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
            {/* ✅ Using HEAD version: px-3 md:px-8 (responsive padding) */}
            <div className="px-3 md:px-8 py-5 flex items-center justify-between flex-wrap gap-3">
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
              <div className="px-3 md:px-8 py-5 border-b border-slate-100 space-y-4">
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

                {walkinSearchError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                    <span className="font-bold">⚠</span> {walkinSearchError}
                  </div>
                )}

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
                            <p className="text-sm text-slate-600 max-w-[160px] line-clamp-2 leading-snug">{walkinSearchResult.symptoms || '—'}</p>
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

           {/* Online Consultation: live FCM queue */}
            {queueTab === 'Online Consultation' && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-xs text-slate-500 font-black uppercase tracking-widest">
                    <th className="px-4 md:px-8 py-4 text-left">Token</th>
                    <th className="px-4 md:px-8 py-4 text-left">Name</th>
                    <th className="px-4 md:px-8 py-4 text-left hidden md:table-cell">Phone</th>
                    <th className="px-4 md:px-8 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingQueue ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
                        Loading queue...
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
                        No online calls yet — patients will appear here when they call.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((p, i) => (
                      <tr key={`${p.id}-${p.token || i}`} className="hover:bg-slate-50 transition-colors bg-blue-50/40">

                        <td className="px-4 md:px-8 py-5">
                          <span className="font-black text-[#0297d6] text-sm">#{p.token}</span>
                        </td>

                        <td className="px-4 md:px-8 py-5">
                          <p className="font-bold text-slate-800 text-sm whitespace-nowrap">
                            {p.firstName} {p.lastName}
                          </p>
                        </td>

                        <td className="px-4 md:px-8 py-5 hidden md:table-cell">
                          <p className="text-sm text-slate-500">{p.phoneNumber || '—'}</p>
                        </td>

                        {/* Status: JOIN button if waiting, badge otherwise */}
                        <td className="px-4 md:px-8 py-5 text-right">
                          {p.status === 'waiting' ? (
                            <button
                              onClick={() => handleStartConsult(p)}
                              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                            >
                              <Video size={15} />
                              JOIN
                            </button>
                          ) : (
                            <CallStatusBadge status={p.status} />
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Completed Today */}
          {/* ✅ Using HEAD version: responsive px-3 md:px-8 padding + whitespace-nowrap on name */}
          {doneQueue.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
              <div className="px-3 md:px-8 py-5 border-b flex items-center gap-3">
                <CheckCircle size={20} className="text-blue-700" />
                <h2 className="font-bold text-xl text-slate-800">COMPLETED TODAY</h2>
                <span className="ml-auto bg-blue-200 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {doneQueue.length} Done
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                    {/* <th className="px-3 md:px-8 py-4 text-left">Sr. No</th> */}
                    <th className="px-3 md:px-8 py-4 text-left">Token</th>
                    <th className="px-3 md:px-8 py-4 text-left">Patient</th>
                    <th className="px-3 md:px-8 py-4 text-left">Symptoms</th>
                    <th className="px-3 md:px-8 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doneQueue.map((p, i) => (
                    <tr key={`done-${p.prescriptionId}`} className="bg-emerald-50/30">
                      {/* <td className="px-3 md:px-8 py-4 font-medium text-slate-400">{i + 1}</td> */}
                      <td className="px-3 md:px-8 py-4 font-bold text-slate-400">#{p.token}</td>
                      <td className="px-3 md:px-8 py-4 text-slate-600 font-semibold whitespace-nowrap">{p.firstName} {p.lastName}</td>
                      <td className="px-3 md:px-8 py-4 text-slate-500 text-sm max-w-[160px]">
                        <span className="line-clamp-2 leading-snug">{p.symptoms || '—'}</span>
                      </td>
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

          

        </main>
      )}

      {/* Consultation Page */}
{activePage === 'consult' && selectedPatient && (
  <DocConsult
    selectedPatient={selectedPatient}
    setSelectedPatient={(p) => { setSelectedPatient(p); if (!p) setActivePage('dashboard'); }}
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

      {/* Profile */}
      {activePage === 'profile' && (
        <DocProfile
          setActivePage={setActivePage}
          doctor={doctor}
          setDoctor={setDoctor}
          editMode={editMode}
          setEditMode={setEditMode}
        />
      )}

      {/* Logout / Go Offline Modal */}
      <DocLogout
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        selectedLogoutReason={selectedLogoutReason}
        setSelectedLogoutReason={setSelectedLogoutReason}
        confirmLogout={confirmLogout}
        cancelLogout={() => { setShowLogoutModal(false); setSelectedLogoutReason(''); }}
        logoutLoading={logoutLoading}
        mode={logoutModalMode}
      />
    </div>
  );
};

export default EZShifaPortal;


// "use client";
// import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import { User, CheckCircle, Clock, Search, X, Video } from 'lucide-react';

// import { apiService } from '@/app/_utils/apiService';
// import Navbar from './components/Navbar';
// import DocConsult from './doc_consult';
// import DocProfile from './docProfile';
// import DocLogout from './docLogout';
// import { CallStatusBadge } from './components/CallStatusBadge';
// import { DoctorProfile } from './doctor_registration';
// import { useCallQueue } from '@/app/_context/CallQueueContext';

// interface Vitals { temp: string; bp: string; pulse: string; weight: string; }
// interface Patient {
//   id: number; token: string; firstName: string; lastName: string;
//   age: number; gender: string; symptoms: string; medicalHistory: string; vitals: Vitals;
// }

// const EZShifaPortal = () => {

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [activePage, setActivePage] = useState<'login' | 'signup' | 'dashboard' | 'profile'>('dashboard');
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [authChecked, setAuthChecked] = useState(false);
//   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

//   const [walkinSearchInput, setWalkinSearchInput] = useState('');
//   const [walkinSearchResult, setWalkinSearchResult] = useState<any | null>(null);
//   const [walkinSearching, setWalkinSearching] = useState(false);
//   const [walkinSearchError, setWalkinSearchError] = useState('');

//   const [showLogoutModal, setShowLogoutModal] = useState(false);
//   const [selectedLogoutReason, setSelectedLogoutReason] = useState('');
//   const [logoutModalMode, setLogoutModalMode] = useState<'offline' | 'logout'>('logout');
//   const [logoutLoading, setLogoutLoading] = useState(false);

//   const [editMode, setEditMode] = useState(false);
//   const [medicines, setMedicines] = useState<any[]>([]);
//   const [notes, setNotes] = useState('');
//   const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
//   const [endingSession, setEndingSession] = useState(false);

//   const [todayStats, setTodayStats] = useState({ todayPatients: 0, inQueue: 0, completed: 0 });
//   const [queue, setQueue] = useState<any[]>([]);
//   const [doneQueue, setDoneQueue] = useState<any[]>([]);
//   const [globalDoneTokens, setGlobalDoneTokens] = useState<Set<string>>(new Set());
//   const [loadingQueue, setLoadingQueue] = useState(false);

//   const [doctorStatus, setDoctorStatus] = useState<'online' | 'offline'>('online');
//   const [togglingStatus, setTogglingStatus] = useState(false);
//   const [queueTab, setQueueTab] = useState<'Walk-in' | 'Online Consultation'>('Walk-in');
//   const [logoutModalMode, setLogoutModalMode] = useState<'offline' | 'logout'>('logout');
  
//   // ── Call Queue Context ──────────────────────────────────────────────────────
//   const { onlineQueue: fcmOnlineQueue, removeCall } = useCallQueue();
//   const router = useRouter();
//   const [profileLoaded, setProfileLoaded] = useState(false);

//   const isFirstStatusDispatch = useRef(true);

//   const [doctor, setDoctor] = useState<DoctorProfile>({
//     title: '', firstName: '', lastName: '', email: '', password: '',
//     phone: '', gender: '', specializations: [], qualifications: [],
//     experience: '', city: '', photo: '',
//   });

//   const router = useRouter();
//   const { onlineQueue: fcmOnlineQueue, removeCall, updateCallStatus } = useCallQueue();

//   // ── Notify layout whenever doctorStatus changes ────────────────────────────
//   // ── Notify layout whenever doctorStatus changes ────────────────────────────
//   // ── Auth + dashboard data load ─────────────────────────────────────────────
//   useEffect(() => {
//     const token = localStorage.getItem('doc_token');
//     console.log("[Auth] doc_token present:", !!token);

//     if (!token) {
//       setAuthChecked(true);
//       return; // isLoggedIn stays false → session expired screen
//     }

//     console.log("Doc Token:", token);
//     setIsLoggedIn(true);

//     const savedDoctor = apiService.getDoctor();
//     if (savedDoctor) setDoctor(savedDoctor);
//     setAuthChecked(true);

//     const loadDashboardData = async () => {
//       console.log("[Dashboard] Loading dashboard data...");
//       setLoadingQueue(true);
//       try {
//         // Profile MUST resolve before anything else so the dispatch
//         // useEffect fires with the real status, not the default 'online'
//         try {
//           const profileRes = await apiService.docGetProfile();
//           if (profileRes.success && profileRes.doctor) {
//             console.log("[Dashboard] Live doctor status:", profileRes.doctor.doctorStatus);
//             setDoctorStatus(profileRes.doctor.doctorStatus as 'online' | 'offline');
//             setDoctor(prev => ({ ...prev, ...profileRes.doctor }));
//           }
//         } catch (profileErr) {
//           console.error("[Dashboard] Failed to fetch live doctor profile:", profileErr);
//         } finally {
//           setProfileLoaded(true); // ← unblocks dispatch useEffect with real status
//         }

//         const docId = savedDoctor?.id as string | undefined;
//         console.log("[Dashboard] Doctor ID:", docId);

//         const [stats, globalData, data] = await Promise.all([
//           apiService.getTodayStats(docId),
//           apiService.getTodayQueue(),
//           apiService.getTodayQueue(docId),
//         ]);

//         console.log("[Dashboard] Stats:", stats);
//         setTodayStats(stats);

//         if (data.success && globalData.success) {
//           const dedupeById = (arr: any[]) => {
//             const seen = new Set();
//             return arr.filter((p: any) => {
//               if (seen.has(p.id)) return false;
//               seen.add(p.id);
//               return true;
//             });
//           };

//           const dedupeByPrescription = (arr: any[]) => {
//             const seen = new Set();
//             return arr.filter((p: any) => {
//               const key = p.prescriptionId || `${p.id}-${p.token}`;
//               if (seen.has(key)) return false;
//               seen.add(key);
//               return true;
//             });
//           };

//           const globallyDoneTokens = new Set<string>(
//             (globalData.completed || []).map((p: any) => String(p.token))
//           );
//           console.log("[Dashboard] Globally done tokens:", globallyDoneTokens.size);

//           const activePatients = dedupeById(data.patients || []).filter(
//             (p: any) => !globallyDoneTokens.has(String(p.token))
//           );
//           console.log("[Dashboard] Active walk-in queue:", activePatients.length);

//           setQueue(activePatients);
//           setDoneQueue(dedupeByPrescription(data.completed || []));
//           setGlobalDoneTokens(globallyDoneTokens);
//         }
//       } catch (err) {
//         console.error("[Dashboard] Failed to load dashboard data:", err);
//       } finally {
//         setLoadingQueue(false);
//       }
//     };

//     loadDashboardData();
//   }, []);

//   // ── Dispatch real doctor status to layout (FCM registration) ──────────────
//   // Gated on BOTH authChecked AND profileLoaded so the layout never receives
//   // the default 'online' value — it always gets the real API value first.
//   useEffect(() => {
//     if (!authChecked || !profileLoaded) return;

//     console.log("[DoctorStatus] Dispatching real status to layout:", doctorStatus);
//     window.dispatchEvent(
//       new CustomEvent('doctor-status-changed', { detail: { status: doctorStatus } })
//     );
//   }, [doctorStatus, authChecked, profileLoaded]);

//   // ── Doctor login event (fired after login flow completes) ──────────────────
//   useEffect(() => {
//     const handleDoctorLogin = () => {
//       console.log("[Auth] doctorLoggedIn event received");
//       const savedDoctor = apiService.getDoctor();
//       if (savedDoctor) setDoctor(savedDoctor);
//     };
//     window.addEventListener('doctorLoggedIn', handleDoctorLogin);
//     return () => window.removeEventListener('doctorLoggedIn', handleDoctorLogin);
//   }, []);

//   // ── Sidebar event listeners ────────────────────────────────────────────────
//   useEffect(() => {
//     const onLogout = () => { setLogoutModalMode('logout'); setShowLogoutModal(true); };
//     const onProfile = () => { setActivePage('profile'); setSelectedPatient(null); };
//     const onDashboard = () => { setActivePage('dashboard'); setSelectedPatient(null); };

//     window.addEventListener('doctor-logout-requested', onLogout);
//     window.addEventListener('doctor-show-profile', onProfile);
//     window.addEventListener('doctor-show-dashboard', onDashboard);
//     return () => {
//       window.removeEventListener('doctor-logout-requested', onLogout);
//       window.removeEventListener('doctor-show-profile', onProfile);
//       window.removeEventListener('doctor-show-dashboard', onDashboard);
//     };
//   }, []);

//   // ── Poll call status for every live online call every 5s ──────────────────
//   useEffect(() => {
//     if (fcmOnlineQueue.length === 0) return;

//     console.log("[Poll] Starting status polling for", fcmOnlineQueue.length, "online call(s)");

//     const interval = setInterval(async () => {
//       for (const call of fcmOnlineQueue) {
//         if (!call.vitalsId) continue;
//         try {
//           const res = await apiService.getCallStatus(call.vitalsId);
//           if (res.success && res.status && res.status !== call.status) {
//             console.log(`[Poll] Status changed for vitalsId ${call.vitalsId}: ${call.status} → ${res.status}`);
//             updateCallStatus(call.vitalsId, res.status);
//           }
//         } catch {
//           // silent — poll will retry next tick
//         }
//       }
//     }, 5000);

//     return () => {
//       console.log("[Poll] Clearing status polling interval");
//       clearInterval(interval);
//     };
//   }, [fcmOnlineQueue, updateCallStatus]);

//   // ── Derived data ───────────────────────────────────────────────────────────
//   const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

//   const walkInQueue = queue.filter(
//     (p: any) => !p.patientType || p.patientType === 'Walk-in'
//   );

//   // Map FCM calls to table row shape, preserving status from context
//   const onlineFcmQueue = fcmOnlineQueue
//     .filter((fcmCall) => !globalDoneTokens.has(String(fcmCall.token)))
//     .map((fcmCall) => ({
//       id: fcmCall.vitalsId,
//       vitalsId: fcmCall.vitalsId,
//       token: fcmCall.token || '—',
//       firstName: fcmCall.title || 'Online',
//       lastName: 'Patient',
//       phoneNumber: null,
//       symptoms: fcmCall.symptoms || fcmCall.body || '—',
//       patientType: 'Online Consultation',
//       callUrl: fcmCall.callUrl,
//       status: fcmCall.status,   // ✅ preserved from context so polling updates reflect here
//       _isFcmCall: true,
//     }));

//   const walkInCount = walkInQueue.length;
//   const onlineCount = onlineFcmQueue.length;

//   const filteredQueue = queueTab === 'Online Consultation' ? onlineFcmQueue : walkInQueue;
//   console.log(filteredQueue)

//   // ── Handlers ───────────────────────────────────────────────────────────────
//   const updateMedicine = (id: number, field: string, value: any) => {
//     setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
//   };

//   const handleWalkinTokenSearch = async () => {
//     const token = walkinSearchInput.trim();
//     if (!token) return;

//     console.log("[WalkIn] Searching for token:", token);
//     setWalkinSearching(true);
//     setWalkinSearchError('');
//     setWalkinSearchResult(null);

//     try {
//       if (globalDoneTokens.has(String(token))) {
//         setWalkinSearchError('This token has already been consulted today.');
//         return;
//       }

//       const res = await apiService.verifyToken(token);
//       if (res.success) {
//         const queueRes = await apiService.getTodayQueue();

//         const freshDoneTokens = new Set<string>(
//           (queueRes.completed || []).map((p: any) => String(p.token))
//         );
//         if (freshDoneTokens.has(String(token))) {
//           setWalkinSearchError('This token has already been consulted today.');
//           return;
//         }

//         const found = (queueRes.patients ?? []).find(
//           (p: any) => String(p.token).toLowerCase() === token.toLowerCase()
//         );

//         if (found) {
//           console.log("[WalkIn] Patient found:", found.firstName, found.lastName);
//           setWalkinSearchResult(found);
//         } else {
//           setWalkinSearchError('Patient found but vitals not recorded yet.');
//         }
//       }
//     } catch (err: any) {
//       const msg = err.message || '';
//       console.error("[WalkIn] Token search error:", msg);
//       setWalkinSearchError(
//         msg.toLowerCase().includes('already used')
//           ? 'This token has already been used today.'
//           : 'Invalid or expired token for today.'
//       );
//     } finally {
//       setWalkinSearching(false);
//     }
//   };

//   const handleStartConsult = async (patient: any) => {
//     if (patient._isFcmCall) {
//       console.log("[Online] Accepting call for vitalsId:", patient.vitalsId);
//       try {
//         const res = await apiService.acceptCall(patient.vitalsId);
//         if (res.success) {
//           console.log("[Online] Call accepted, navigating to:", patient.callUrl);
//           removeCall(patient.vitalsId);
//           window.location.href = patient.callUrl;
//         }
//       } catch (err) {
//         console.error("[Online] Failed to accept call:", err);
//       }
//       return;
//     }
//     console.log("[WalkIn] Starting consult for patient:", patient.firstName, patient.lastName);
//     setSelectedPatient(patient);
//   };

//   const handleSessionEnd = async (completedPatient: any) => {
//     console.log("[Session] Ending session for:", completedPatient.firstName, completedPatient.lastName);
//     setQueue(prev => prev.filter(p => p.id !== completedPatient.id));
//     setDoneQueue(prev => [...prev, completedPatient]);
//     setSelectedPatient(null);
//     setMedicines([]);
//     setNotes('');
//     setPrescriptionGenerated(false);
//     setEndingSession(false);
//     try {
//       const docId = apiService.getDoctor()?.id as string | undefined;
//       const stats = await apiService.getTodayStats(docId);
//       setTodayStats(stats);
//       console.log("[Session] Stats refreshed after session end:", stats);
//     } catch (err) {
//       console.error("[Session] Failed to refresh stats:", err);
//     }
//   };

//   const confirmLogout = async () => {
//     if (!selectedLogoutReason) return;
//     setLogoutLoading(true);
//     console.log("[Logout] Mode:", logoutModalMode, "| Reason:", selectedLogoutReason);
//     try {
//       if (logoutModalMode === 'offline') {
//         await apiService.updateDoctorStatus('offline', selectedLogoutReason);
//         setDoctorStatus('offline');
//         setShowLogoutModal(false);
//         setSelectedLogoutReason('');
//         console.log("[Logout] Doctor set to offline");
//       } else {
//         window.dispatchEvent(new CustomEvent('doctor-logged-out'));
//         await apiService.updateDoctorStatus('offline', selectedLogoutReason);
//         await apiService.docLogoutWithReason(selectedLogoutReason);
//         localStorage.removeItem('doc_token');
//         localStorage.removeItem('doctor');
//         setShowLogoutModal(false);
//         setIsLoggedIn(false);
//         setSelectedLogoutReason('');
//         setSelectedPatient(null);
//         setDoctorStatus('offline');
//         console.log("[Logout] Doctor logged out, redirecting to sign-in");
//         router.push('/sign-in');
//       }
//     } catch (err) {
//       console.error("[Logout] Error during logout:", err);
//     } finally {
//       setLogoutLoading(false);
//     }
//   };

//   const handleToggleStatus = async () => {
//     if (doctorStatus === 'online') {
//       setLogoutModalMode('offline');
//       setShowLogoutModal(true);
//       return;
//     }
//     console.log("[Status] Toggling doctor status to online");
//     setTogglingStatus(true);
//     try {
//       const data = await apiService.updateDoctorStatus('online');
//       if (data.success) {
//         console.log("[Status] Doctor now:", data.doctorStatus);
//         setDoctorStatus(data.doctorStatus);
//       }
//     } catch (err) {
//       console.error("[Status] Toggle failed:", err);
//     } finally {
//       setTogglingStatus(false);
//     }
//   };

//   // ── Loading guard (while auth is being checked) ───────────────────────────
//   // ── Loading guard ──────────────────────────────────────────────────────────
//   if (!authChecked) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-white">
//         <span className="w-7 h-7 border-[3px] border-[#0297d6] border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   // ── Session expired guard ──────────────────────────────────────────────────
//   if (!isLoggedIn) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-white">
//         <div className="text-center space-y-4">
//           <p className="text-slate-500 font-medium">Session expired. Please sign in again.</p>
//           <button
//             onClick={() => { window.location.href = '/sign-in'; }}
//             className="px-6 py-2.5 bg-[#0297d6] text-white rounded-xl font-bold"
//           >
//             Go to Sign In
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-dvh bg-white text-sm overflow-x-hidden">
//       <Navbar
//         fullName={fullName}
//         doctorPhoto={doctor.photo}
//         onProfileClick={() => setActivePage('profile')}
//         onLogoutClick={() => { setLogoutModalMode('logout'); setShowLogoutModal(true); }}
//         doctorStatus={doctorStatus}
//         togglingStatus={togglingStatus}
//         onToggleStatus={handleToggleStatus}
//         onMenuClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
//       />

//       {/* ── Dashboard ── */}
//       {activePage === 'dashboard' && (
//         <main className="max-w-7xl mx-auto p-3 md:p-6 pb-6">

//           {/* Stats Cards */}
//           <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
//             {[
//               { label: 'TODAY PATIENTS', val: todayStats.todayPatients, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
//               { label: 'IN QUEUE', val: todayStats.inQueue, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
//               { label: 'COMPLETED', val: todayStats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
//             ].map((s, i) => (
//               <div key={i} className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-6 flex flex-col md:flex-row items-center gap-2 md:gap-5 shadow-sm border border-slate-100">
//                 <div className={`w-8 h-8 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center ${s.bg} ${s.color}`}>
//                   <s.icon size={18} className="md:hidden" />
//                   <s.icon size={32} className="hidden md:block" />
//                 </div>
//               ))}
//             </div>

//             {/* Current Patient Queue */}
//             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">

//               {/* Queue header + tab switcher */}
//               <div className="px-3 md:px-8 py-5 flex items-center justify-between flex-wrap gap-3">
//                 <h2 className="font-bold text-xl text-slate-800">CURRENT PATIENT QUEUE</h2>
//                 <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
//                   {(['Walk-in', 'Online Consultation'] as const).map((tab) => (
//                     <button
//                       key={tab}
//                       onClick={() => setQueueTab(tab)}
//                       className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${queueTab === tab
//                         ? 'bg-white text-[#0297d6] shadow-sm'
//                         : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                     >
//                       {tab === 'Walk-in'
//                         ? `🏥 Walk-in (${walkInCount})`
//                         : `💻 Online (${onlineCount})`}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Patient Queue */}
//           <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">

//             {/* Header + Tab Switcher */}
//             <div className="px-8 py-5 flex items-center justify-between flex-wrap gap-3">
//               <h2 className="font-bold text-xl text-slate-800">CURRENT PATIENT QUEUE</h2>
//               <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
//                 {(['Walk-in', 'Online Consultation'] as const).map((tab) => (
//                   <button
//                     key={tab}
//                     onClick={() => setQueueTab(tab)}
//                     className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${queueTab === tab ? 'bg-white text-[#0297d6] shadow-sm' : 'text-slate-500 hover:text-slate-700'
//                       }`}
//                   >
//                     {tab === 'Walk-in' ? `🏥 Walk-in (${walkInCount})` : `💻 Online (${onlineCount})`}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Walk-in: token lookup */}
//             {queueTab === 'Walk-in' && (
//               <div className="px-8 py-5 border-t border-slate-100 space-y-4">
//                 <div className="flex items-center gap-3">
//                   <div className="relative w-full max-w-sm">
//                     <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                     <input
//                       type="text"
//                       value={walkinSearchInput}
//                       onChange={e => {
//                         setWalkinSearchInput(e.target.value);
//                         setWalkinSearchResult(null);
//                         setWalkinSearchError('');
//                       }}
//                       onKeyDown={e => e.key === 'Enter' && handleWalkinTokenSearch()}
//                       placeholder="Enter patient token number..."
//                       className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0297d6] focus:ring-2 focus:ring-[#0297d6]/10"
//                     />
//                     {walkinSearchInput && (
//                       <button
//                         onClick={() => { setWalkinSearchInput(''); setWalkinSearchResult(null); setWalkinSearchError(''); }}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                       >
//                         <X size={14} />
//                       </button>
//                     )}
//                   </div>
//                   <button
//                     onClick={handleWalkinTokenSearch}
//                     disabled={walkinSearching || !walkinSearchInput.trim()}
//                     className="flex items-center gap-2 px-5 py-2.5 bg-[#0297d6] hover:bg-[#0286c2] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
//                   >
//                     {walkinSearching
//                       ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching</>
//                       : <><Search size={14} />Find</>}
//                   </button>
//                 </div>

//                 {walkinSearchError && (
//                   <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
//                     <span className="font-bold">⚠</span> {walkinSearchError}
//                   </div>
//                 )}

//                 {walkinSearchResult && (
//                   <div className="rounded-xl border border-[#0297d6]/20 bg-[#0297d6]/5 overflow-hidden">
//                     <table className="w-full text-left">
//                       <thead className="bg-[#0297d6]/10">
//                         <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
//                           <th className="px-5 py-3">Token</th>
//                           <th className="px-5 py-3">Name</th>
//                           <th className="px-5 py-3 hidden sm:table-cell">Phone</th>
//                           <th className="px-5 py-3">Symptoms</th>
//                           <th className="px-5 py-3 text-right">Action</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         <tr>
//                           <td className="px-5 py-4">
//                             <span className="font-black text-[#0297d6] text-sm">#{walkinSearchResult.token}</span>
//                           </td>
//                           <td className="px-5 py-4">
//                             <p className="font-bold text-slate-800 text-sm">
//                               {walkinSearchResult.firstName} {walkinSearchResult.lastName}
//                             </p>
//                           </td>
//                           <td className="px-5 py-4 hidden sm:table-cell">
//                             <p className="text-sm text-slate-500">{walkinSearchResult.phoneNumber || '—'}</p>
//                           </td>
//                           <td className="px-5 py-4">
//                             <p className="text-sm text-slate-600 max-w-xs truncate">{walkinSearchResult.symptoms || '—'}</p>
//                           </td>
//                           <td className="px-5 py-4 text-right">
//                             <button
//                               onClick={() => {
//                                 handleStartConsult(walkinSearchResult);
//                                 setWalkinSearchInput('');
//                                 setWalkinSearchResult(null);
//                                 setWalkinSearchError('');
//                               }}
//                               className="bg-[#0297d6] hover:bg-[#0286c2] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all"
//                             >
//                               START
//                             </button>
//                           </td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Online Consultation: live FCM queue */}
//             {/* Online Consultation: live FCM queue */}
//             {queueTab === 'Online Consultation' && (
//               <table className="w-full">
//                 <thead className="bg-slate-50">
//                   <tr className="text-xs text-slate-500 font-black uppercase tracking-widest">
//                     <th className="px-3 md:px-8 py-4 text-left">Sr.</th>
//                     <th className="px-3 md:px-8 py-4 text-left">Token</th>
//                     <th className="px-3 md:px-8 py-4 text-left">Name</th>
//                     <th className="px-3 md:px-8 py-4 text-left hidden md:table-cell">Phone</th>
//                     <th className="px-3 md:px-8 py-4 text-left">Symptoms</th>
//                     <th className="px-3 md:px-8 py-4 text-right">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {loadingQueue ? (
//                     <tr>
//                       <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
//                         Loading queue...
//                       </td>
//                     </tr>
//                   ) : filteredQueue.length === 0 ? (
//                     <tr>
//                       <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
//                         No online calls yet — patients will appear here when they call.
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredQueue.map((p, i) => (
//                       <tr
//                         key={`${p.id}-${p.token || i}`}
//                         className={`hover:bg-slate-50 transition-colors ${p._isFcmCall ? 'bg-blue-50/40' : ''}`}
//                       >
//                         {/* Sr */}
//                         <td className="px-3 md:px-8 py-5 text-sm font-medium text-slate-400">{i + 1}</td>

//                         {/* Token */}
//                         <td className="px-3 md:px-8 py-5">
//                           <div className="flex items-center gap-2">
//                             <span className="font-black text-[#0297d6] text-sm">#{p.token}</span>
//                             {p._isFcmCall && (
//                               <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
//                                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
//                                 Live
//                               </span>
//                             )}
//                           </div>
//                         </td>

//                         {/* Name */}
//                         <td className="px-8 py-5">
//                           <p className="font-bold text-slate-800 text-sm whitespace-nowrap">
//                             {p.firstName} {p.lastName}
//                           </p>
//                         </td>

// <<<<<<< HEAD
//                         {/* Phone */}
//                         <td className="px-3 md:px-8 py-5 hidden md:table-cell">
//                           <p className="text-sm text-slate-500">{p.phoneNumber || '—'}</p>
//                         </td>

//                         {/* Symptoms */}
//                         <td className="px-8 py-5">
//                           <p className="text-sm text-slate-600 max-w-xs truncate">{p.symptoms || '—'}</p>
//                         </td>

//                         {/* Action */}
//                         <td className="px-3 md:px-8 py-5 text-right">
//                           {p._isFcmCall ? (
// =======
//                         <td className="px-4 md:px-8 py-5 hidden md:table-cell">
//                           <p className="text-sm text-slate-500">{p.phoneNumber || '—'}</p>
//                         </td>

//                         {/* Status: JOIN button if waiting, badge otherwise */}
//                         <td className="px-4 md:px-8 py-5 text-right">
//                           {p.status === 'waiting' ? (
// >>>>>>> 32c8f8a53dc1faa1ffeb8d6da38cd3a1c0396ce1
//                             <button
//                               onClick={() => handleStartConsult(p)}
//                               className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
//                             >
//                               <Video size={15} />
//                               JOIN
//                             </button>
//                           ) : (
//                             <CallStatusBadge status={p.status} />
//                           )}
//                         </td>

//                       </tr>
//                     ))
//                   )}
//                 </tbody>
// <<<<<<< HEAD
//               </table>}
//             </div>

//             {/* Completed Today */}
//             {doneQueue.length > 0 && (
//               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
//                 <div className="px-3 md:px-8 py-5 border-b flex items-center gap-3">
//                   <CheckCircle size={20} className="text-blue-700" />
//                   <h2 className="font-bold text-xl text-slate-800">COMPLETED TODAY</h2>
//                   <span className="ml-auto bg-blue-200 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
//                     {doneQueue.length} Done
//                   </span>
//                 </div>
//                 <table className="w-full">
//                   <thead className="bg-slate-50">
//                     <tr className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
//                       <th className="px-3 md:px-8 py-4 text-left">Sr. No</th>
//                       <th className="px-3 md:px-8 py-4 text-left">Token</th>
//                       <th className="px-3 md:px-8 py-4 text-left">Patient</th>
//                       <th className="px-3 md:px-8 py-4 text-left">Symptoms</th>
//                       <th className="px-3 md:px-8 py-4 text-right">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {doneQueue.map((p, i) => (
//                       <tr key={`done-${p.prescriptionId}`} className="bg-emerald-50/30">
//                         <td className="px-3 md:px-8 py-4 font-medium text-slate-400">{i + 1}</td>
//                         <td className="px-3 md:px-8 py-4 font-bold text-slate-400">#{p.token}</td>
//                         <td className="px-3 md:px-8 py-4 text-slate-600 font-semibold whitespace-nowrap">{p.firstName} {p.lastName}</td>
//                         <td className="px-3 md:px-8 py-4 text-slate-500 text-sm">{p.symptoms || '—'}</td>
//                         <td className="px-4 py-4 text-right">
//                           <span className="bg-blue-200 text-blue-700 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
//                             ✓ Done
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
// =======
//               </table>
// >>>>>>> 32c8f8a53dc1faa1ffeb8d6da38cd3a1c0396ce1
//             )}
//           </div>

//           {/* Completed Today */}
//           {doneQueue.length > 0 && (
//             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
//               <div className="px-8 py-5 border-b flex items-center gap-3">
//                 <CheckCircle size={20} className="text-blue-700" />
//                 <h2 className="font-bold text-xl text-slate-800">COMPLETED TODAY</h2>
//                 <span className="ml-auto bg-blue-200 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
//                   {doneQueue.length} Done
//                 </span>
//               </div>
//               <table className="w-full">
//                 <thead className="bg-slate-50">
//                   <tr className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
//                     <th className="px-8 py-4 text-left">Sr. No</th>
//                     <th className="px-8 py-4 text-left">Token</th>
//                     <th className="px-8 py-4 text-left">Patient</th>
//                     <th className="px-8 py-4 text-left">Symptoms</th>
//                     <th className="px-8 py-4 text-right">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {doneQueue.map((p, i) => (
//                     <tr key={`done-${p.prescriptionId}`} className="bg-emerald-50/30">
//                       <td className="px-8 py-4 font-medium text-slate-400">{i + 1}</td>
//                       <td className="px-8 py-4 font-bold text-slate-400">#{p.token}</td>
//                       <td className="px-8 py-4 text-slate-600 font-semibold">{p.firstName} {p.lastName}</td>
//                       <td className="px-8 py-4 text-slate-500 text-sm">{p.symptoms || '—'}</td>
//                       <td className="px-4 py-4 text-right">
//                         <span className="bg-blue-200 text-blue-700 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
//                           ✓ Done
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Walk-in Consultation Panel */}
//           {selectedPatient && (
//             <DocConsult
//               selectedPatient={selectedPatient}
//               setSelectedPatient={setSelectedPatient}
//               medicines={medicines}
//               setMedicines={setMedicines}
//               notes={notes}
//               setNotes={setNotes}
//               prescriptionGenerated={prescriptionGenerated}
//               setPrescriptionGenerated={setPrescriptionGenerated}
//               doctor={doctor}
//               updateMedicine={updateMedicine}
//               fullName={fullName}
//               onSessionEnd={handleSessionEnd}
//               endingSession={endingSession}
//               setEndingSession={setEndingSession}
//             />
//           )}

//         </main>
//       )}

//       {/* Profile */}
//       {activePage === 'profile' && (
//         <DocProfile
//           setActivePage={setActivePage}
//           doctor={doctor}
//           setDoctor={setDoctor}
//           editMode={editMode}
//           setEditMode={setEditMode}
//         />
//       )}

//       {/* Logout / Go Offline Modal */}
//       <DocLogout
//         showLogoutModal={showLogoutModal}
//         setShowLogoutModal={setShowLogoutModal}
//         selectedLogoutReason={selectedLogoutReason}
//         setSelectedLogoutReason={setSelectedLogoutReason}
//         confirmLogout={confirmLogout}
//         cancelLogout={() => { setShowLogoutModal(false); setSelectedLogoutReason(''); }}
//         logoutLoading={logoutLoading}
//         mode={logoutModalMode}
//       />
//     </div>
//   );
// };

// export default EZShifaPortal;