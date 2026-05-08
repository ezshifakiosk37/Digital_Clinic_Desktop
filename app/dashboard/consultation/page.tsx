// consultation/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, CheckCircle, Clock, Search, X, Video } from 'lucide-react';
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient";

import { apiService } from '@/app/_utils/apiService';
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';

import Navbar from './components/Navbar';
import DocConsult from './doc_consult';
import DocProfile from './docProfile';
import DocLogout from './docLogout';
import DocSignin from './docSignin';
import DocSignup from './docSignup';
import GlobalCallSidebar from './components/GlobalCallSidebar';

import { DoctorProfile } from './doctor_registration';
import { useCallQueue } from '@/app/_context/CallQueueContext';

interface Vitals { temp: string; bp: string; pulse: string; weight: string; }
interface Patient {
  id: number; token: string; firstName: string; lastName: string;
  age: number; gender: string; symptoms: string; medicalHistory: string; vitals: Vitals;
}

const EZShifaPortal = () => {
  // ── Auth / page state ──────────────────────────────────────────────────────
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
  const [doctorStatus, setDoctorStatus] = useState<'online' | 'offline'>('online');
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [queueTab, setQueueTab] = useState<'Walk-in' | 'Online Consultation'>('Walk-in');
  const [logoutModalMode, setLogoutModalMode] = useState<'offline' | 'logout'>('logout');

  const [doctor, setDoctor] = useState<DoctorProfile>({
    title: '', firstName: '', lastName: '', email: '', password: '',
    phone: '', gender: '', specializations: [], qualifications: [],
    experience: '', city: '', photo: '',
  });

  // ── FCM refs ───────────────────────────────────────────────────────────────
  const messagingRef = useRef<ReturnType<typeof getMessaging> | null>(null);
  const fcmTokenRef = useRef<string | null>(null);
  const fcmListenerRef = useRef<(() => void) | null>(null);
  const fcmRegisteredRef = useRef(false);

   // ── Call Queue Context ─────────────────────────────────────────────────────
  const { onlineQueue: fcmOnlineQueue, addCall, removeCall, updateCallStatus } = useCallQueue();

  // Build call payload from incoming notification
  const buildCallPayload = (payload: any) => {
    const vitalsId = payload?.vitalsId || payload?.data?.vitalsId;
    const patientId = payload?.patientId || payload?.data?.patientId;
    const patientToken = payload?.patientToken || payload?.data?.patientToken || payload?.data?.token;

    console.log("📦 [buildCallPayload] raw payload.data:", payload?.data);
    console.log("📦 [buildCallPayload] token:", payload?.data?.token);

    return {
      vitalsId,
      title: payload?.notification?.title || payload?.title || 'Incoming Call',
      body: payload?.notification?.body || payload?.body || '',
      callUrl: `/dashboard/video-call/${vitalsId}`,
      token: payload?.data?.token,
      symptoms: payload?.data?.symptoms,
      patientId,
      patientToken,
      status: 'waiting' as const,
    };
  };

  // ── FCM registration ───────────────────────────────────────────────────────
  const registerFcm = useCallback(async () => {
    if (fcmRegisteredRef.current) return;
    const jwt = localStorage.getItem('doc_token');
    if (!jwt) return;

    const saveToken = async (token: string) => {
      fcmTokenRef.current = token;
      try {
        const res = await apiService.saveDoctorFcmToken(token);
        if (res.success) console.log("[FCM] Device registered.");
      } catch (err: any) {
        console.error("[FCM] Save failed:", err.message);
      }
    };

    const handleIncomingCall = (payload: any) => {
      const call = buildCallPayload(payload);
      if (!call.vitalsId) return;
      addCall(call);
    };

    if (typeof window === 'undefined') return;

    if (window.AndroidNative) {
      AndroidBridge.initFcmListener((token) => saveToken(token));
      AndroidBridge.requestNativeFcmToken();
      const androidHandler = (e: Event) => handleIncomingCall((e as CustomEvent).detail);
      window.addEventListener('incoming-call', androidHandler);
      fcmListenerRef.current = () => window.removeEventListener('incoming-call', androidHandler);
    } else if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { console.warn("[FCM] Permission denied."); return; }

        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const messaging = getMessaging(firebaseApp);
        messagingRef.current = messaging;

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });
        if (token) await saveToken(token);

        fcmListenerRef.current = onMessage(messaging, handleIncomingCall);
      } catch (err) {
        console.error("[FCM] Web setup error:", err);
        return;
      }
    }

    fcmRegisteredRef.current = true;
  }, [addCall]);

  // ── FCM unregistration ─────────────────────────────────────────────────────
  const unregisterFcm = useCallback(async (shouldCleanup: boolean = true) => {
    if (!fcmRegisteredRef.current) return;

    if (fcmListenerRef.current) {
      fcmListenerRef.current();
      fcmListenerRef.current = null;
    }

    if (window.AndroidNative) {
      try {
        if (typeof window.AndroidNative.unregisterFcmDevice === 'function') {
          window.AndroidNative.unregisterFcmDevice();
        }
      } catch { }
    } else if (messagingRef.current && fcmTokenRef.current && shouldCleanup) {
      try {
        await deleteToken(messagingRef.current);
        console.log("[FCM] Device unregistered.");
      } catch (err) {
        console.error("[FCM] Token deletion failed:", err);
      }
      messagingRef.current = null;
      fcmTokenRef.current = null;
    }

    fcmRegisteredRef.current = false;
  }, []);

  // Gate FCM based on doctor's online status
  useEffect(() => {
    if (!isLoggedIn || !authChecked) return;
    if (doctorStatus === 'online') {
      registerFcm();
    } else {
      unregisterFcm(true);
    }
  }, [isLoggedIn, authChecked, doctorStatus, registerFcm, unregisterFcm]);

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('doc_token');
    if (token) { setIsLoggedIn(true); } else { setActivePage('login'); }

    const savedDoctor = apiService.getDoctor();
    if (savedDoctor) {
      setDoctor(savedDoctor);
      if (savedDoctor.doctorStatus) {
        setDoctorStatus(savedDoctor.doctorStatus as 'online' | 'offline');
      }
    }
    setAuthChecked(true);
  }, []);

  // Load dashboard data (walk-in queue)
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingQueue(true);
      try {
        const stats = await apiService.getTodayStats();
        setTodayStats(stats);

        const data = await apiService.getTodayQueue();
        if (data.success) {
          const dedupeById = (arr: any[]) => {
            const seen = new Set();
            return arr.filter((p: any) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
          };
          const dedupeByPrescription = (arr: any[]) => {
            const seen = new Set();
            return arr.filter((p: any) => {
              const key = p.prescriptionId || `${p.id}-${p.token}`;
              if (seen.has(key)) return false; seen.add(key); return true;
            });
          };
          setQueue(dedupeById((data.patients || []).filter((p: any) =>
            !p.patientType || p.patientType === 'Walk-in'
          )));
          setDoneQueue(dedupeByPrescription(data.completed || []));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
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

  // Doctor login event
  useEffect(() => {
    const handleDoctorLogin = () => {
      const savedDoctor = apiService.getDoctor();
      if (savedDoctor) setDoctor(savedDoctor);
    };
    window.addEventListener('doctorLoggedIn', handleDoctorLogin);
    return () => window.removeEventListener('doctorLoggedIn', handleDoctorLogin);
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

  const activeOnlineCalls = fcmOnlineQueue.filter(
    call => call.status === 'waiting' || call.status === 'not_responding'
  );

  const walkInCount = queue.length;
  const onlineCount = activeOnlineCalls.length;

  const filteredQueue = queueTab === 'Walk-in'
    ? queue.filter(p =>
      !tokenSearch || String(p.token || '').toLowerCase().includes(tokenSearch.toLowerCase())
    )
    : activeOnlineCalls.filter(p =>
      !tokenSearch || String(p.token || '').toLowerCase().includes(tokenSearch.toLowerCase())
    ).map(call => ({
      id: call.vitalsId,
      vitalsId: call.vitalsId,
      token: call.token || '—',
      symptoms: call.symptoms || call.body || '—',
      firstName: call.title || 'Online',
      lastName: 'Patient',
      patientType: 'Online Consultation',
      callUrl: call.callUrl,
      patientId: call.patientId,
      patientToken: call.patientToken,
      status: call.status,
      _isFcmCall: true,
    }));

  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
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
    setMedicines([]); setNotes(''); setPrescriptionGenerated(false); setEndingSession(false);
    try {
      const stats = await apiService.getTodayStats();
      setTodayStats(stats);
    } catch (err) { console.error("Failed to refresh stats:", err); }
  };

  const handleLogoutClick = () => {
    setLogoutModalMode('logout');
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setSelectedLogoutReason('');
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
        await unregisterFcm(true);
        await apiService.updateDoctorStatus('offline', selectedLogoutReason);
        await apiService.docLogoutWithReason(selectedLogoutReason);
        localStorage.removeItem('doc_token');
        localStorage.removeItem('doctor');
        setShowLogoutModal(false);
        setIsLoggedIn(false);
        setActivePage('login');
        setSelectedLogoutReason('');
        setSelectedPatient(null);
        setDoctorStatus('offline');
      }
    } catch (err) {
      console.error("Logout/offline error:", err);
    } finally {
      setLogoutLoading(false);  // ✅ always resets
    }
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
      console.error("Status toggle failed:", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── Auth gates ─────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return activePage === 'login'
      ? <DocSignin setActivePage={setActivePage} setIsLoggedIn={setIsLoggedIn} />
      : <DocSignup setActivePage={setActivePage} />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
      return (
        <div className="min-h-screen bg-white">
          <GlobalCallSidebar />

          <Navbar
            fullName={fullName}
            doctorPhoto={doctor.photo}
            onProfileClick={() => setActivePage('profile')}
            onLogoutClick={handleLogoutClick}
            doctorStatus={doctorStatus}
            togglingStatus={togglingStatus}
            onToggleStatus={handleToggleStatus}
          />

          <main className="max-w-7xl mx-auto p-6">

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
                  <div className="px-8 py-5 border-b flex items-center justify-between flex-wrap gap-3">
                    <h2 className="font-bold text-xl text-slate-800">CURRENT PATIENT QUEUE</h2>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      {(['Walk-in', 'Online Consultation'] as const).map((tab) => (
                        <button key={tab} onClick={() => setQueueTab(tab)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${queueTab === tab ? 'bg-white text-[#0297d6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {tab === 'Walk-in' ? `🏥 Walk-in (${walkInCount})` : `💻 Online (${onlineCount})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                        <th className="px-8 py-4 text-left">Sr. No</th>
                        <th className="px-8 py-4 text-left">
                          Token Number
                          {tokenEditMode ? (
                            <span className="inline-flex items-center ml-3">
                              <input autoFocus type="text" value={tokenSearch}
                                onChange={(e) => setTokenSearch(e.target.value)}
                                placeholder="Search..."
                                className="bg-white border border-[#0297d6] rounded px-3 py-1 text-sm w-32 focus:outline-none font-normal normal-case" />
                              <button onClick={() => { setTokenSearch(''); setTokenEditMode(false); }}
                                className="ml-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
                            </span>
                          ) : (
                            <button onClick={() => setTokenEditMode(true)} className="ml-2 hover:text-[#0297d6] align-middle">
                              <Search size={16} />
                            </button>
                          )}
                        </th>
                        <th className="px-8 py-4 text-left">Symptoms</th>
                        <th className="px-8 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingQueue ? (
                        <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">Loading queue...</td></tr>
                      ) : filteredQueue.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm">
                            {tokenSearch ? `No patients matching "${tokenSearch}"` : `No patients in ${queueTab === 'Walk-in' ? 'walk-in' : 'online'} queue.`}
                          </td>
                        </tr>
                      ) : (
                        filteredQueue.map((p, i) => (
                          <tr
                            key={`${p.id}-${p.token || i}`}
                            className={`hover:bg-slate-50 transition-colors ${p._isFcmCall ? 'bg-blue-50/40' : ''
                              }`}
                          >
                              <td className="px-8 py-5 font-medium text-slate-600">{i + 1}</td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#0297d6]">#{p.token}</span>
                                  {p._isFcmCall && p.status === 'waiting' && (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Live
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-5 text-slate-700">{p.symptoms}</td>
                              <td className="px-8 py-5 text-right">
                                {p._isFcmCall ? (
                                  p.status === 'waiting' ? (
                                    <button onClick={() => handleStartConsult(p)}
                                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all">
                                      <Video size={15} /> JOIN
                                    </button>
                                  ) : p.status === 'not_responding' ? (
                                    <span className="inline-block bg-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm font-bold">
                                      Not Responding
                                    </span>
                                  ) : null
                                ) : (
                                  <button onClick={() => handleStartConsult(p)}
                                    className="bg-[#0297d6] hover:bg-[#0288c2] text-white px-8 py-2.5 rounded-xl text-sm font-bold tracking-widest transition-all">
                                    START
                                  </button>
                                )}
                              </td>
                            </tr>
                            ))
                  )}
                          </tbody>
              </table>
                </div>

                {/* Completed Today */}
                {doneQueue.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
                    <div className="px-8 py-5 border-b flex items-center gap-3">
                      <CheckCircle size={20} className="text-blue-700" />
                      <h2 className="font-bold text-xl text-slate-800">COMPLETED TODAY</h2>
                      <span className="ml-auto bg-blue-200 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">{doneQueue.length} Done</span>
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
                              <span className="bg-blue-200 text-blue-700 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">✓ Done</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Patient Consultation (walk‑in) */}
            {selectedPatient && activePage === 'dashboard' && (
              <DocConsult
                selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
                medicines={medicines} setMedicines={setMedicines}
                notes={notes} setNotes={setNotes}
                prescriptionGenerated={prescriptionGenerated} setPrescriptionGenerated={setPrescriptionGenerated}
                doctor={doctor} updateMedicine={updateMedicine} fullName={fullName}
                onSessionEnd={handleSessionEnd} endingSession={endingSession} setEndingSession={setEndingSession}
              />
            )}

            {/* Profile */}
            {activePage === 'profile' && (
              <DocProfile setActivePage={setActivePage} doctor={doctor} setDoctor={setDoctor}
                editMode={editMode} setEditMode={setEditMode} />
            )}
          </main>

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