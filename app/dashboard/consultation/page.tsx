// consultation/page.tsx
"use client";
import React, { useState } from 'react';
import { User, CheckCircle, Clock, Search, X } from 'lucide-react';

import Navbar from './components/Navbar';
import DocConsult from './doc_consult';
import DocProfile from './docProfile';
import DocLogout from './docLogout';
import DocSignin from './docSignin';
import DocSignup from './docSignup';

import { DoctorProfile } from './doctor_registration';

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
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenEditMode, setTokenEditMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedLogoutReason, setSelectedLogoutReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);

  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev =>
      prev.map(m => m.id === id ? { ...m, [field]: value } : m)
    );
  };

  const [doctor, setDoctor] = useState<DoctorProfile>({
    title: 'Dr.',
    firstName: 'Muhammad',
    lastName: 'Umer',
    email: 'umer.dev@example.com',
    password: 'password123',
    phone: '+92 300 1234567',
    gender: 'Male',
    specializations: ['General Physician'],
    qualifications: ['MBBS', 'MD'],
    experience: '5',
    city: 'Karachi',
    photo: '',
  });

  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

  const queue: Patient[] = [
    {
      id: 1, token: '101', firstName: 'Ahmed', lastName: 'Khan', age: 45, gender: 'Male',
      symptoms: 'Persistent Cough, Fever', medicalHistory: 'Type 2 Diabetes',
      vitals: { temp: '101.2°F', bp: '130/85', pulse: '88 bpm', weight: '75kg' },
    },
    {
      id: 2, token: '102', firstName: 'Sara', lastName: 'Ahmed', age: 29, gender: 'Female',
      symptoms: 'Severe Headache', medicalHistory: 'Migraine',
      vitals: { temp: '98.4°F', bp: '110/70', pulse: '72 bpm', weight: '60kg' },
    },
  ];

  const filteredQueue = queue.filter(p =>
    !tokenSearch || p.token.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const handleStartConsult = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    if (selectedLogoutReason) {
      setShowLogoutModal(false);
      setIsLoggedIn(false);           // Important: Log out the user
      setActivePage('login');         // Redirect to signin page
      setSelectedLogoutReason('');
      setSelectedPatient(null);
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
                { label: 'TODAY PATIENTS', val: '24', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'IN QUEUE', val: '08', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'COMPLETED', val: '16', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                    <tr key={p.id} className="hover:bg-slate-50">
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
      />
    </div>
  );
};

export default EZShifaPortal;