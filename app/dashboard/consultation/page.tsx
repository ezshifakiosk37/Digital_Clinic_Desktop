"use client";
import React, { useState } from 'react';
import {
  LogOut, Trash2, Printer, Search,
  User, CheckCircle, Clock, Pill, X, Edit2
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// CONFIG (inline version of doctor_registration.ts)
// ──────────────────────────────────────────────────────────────────────────────
const TITLE_OPTIONS = ['Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Prof.', 'Assoc. Prof.'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const SPECIALIZATION_OPTIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'ENT',
  'Gynecologist', 'Neurologist', 'Orthopedic', 'Pediatrician',
  'Psychiatrist', 'Urologist', 'Other',
];
const QUALIFICATION_OPTIONS = [
  'MBBS', 'BDS', 'MD', 'MS', 'FCPS', 'MRCP', 'MRCS', 'PhD', 'DPT', 'Pharm-D', 'Other',
];
const CITY_OPTIONS = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Abbottabad', 'Mardan', 'Mingora', 'Rahim Yar Khan', 'Sahiwal',
];
// ─── Logout Reasons ─────────────────────────────────────────────────────────
const LOGOUT_REASONS = [
  'Meal Break',
  'Namaz break',
  'Meeting break',
  'Shift Ends',
  'Smoking Break',
  'Tea Break',
  'Washroom break - Restroom break'
];

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────
interface Vitals { temp: string; bp: string; pulse: string; weight: string; }
interface Patient {
  id: number; token: string; firstName: string; lastName: string;
  age: number; gender: string; symptoms: string; medicalHistory: string; vitals: Vitals;
}
interface DoctorProfile {
  title: string; firstName: string; lastName: string;
  email: string; password: string; phone: string; gender: string;
  specializations: string[]; qualifications: string[];
  experience: string; city: string; photo: string;
}
type Page = 'login' | 'signup' | 'dashboard' | 'profile';

// ──────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────
const MultiSelect = ({
  options, selected, onChange, placeholder, disabled = false, allowCustom = false, position = 'bottom'
}: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  placeholder: string; disabled?: boolean; allowCustom?: boolean; position?: 'top' | 'bottom';
}) => {
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const toggle = (s: string) =>
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className="w-full min-h-10.5 px-3 py-1.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-left flex flex-wrap items-center gap-1 pr-7 disabled:opacity-60 disabled:cursor-default"
      >
        {selected.length > 0 ? selected.map(s => (
          <span key={s} className="bg-[#0297d6]/10 text-[#0297d6] text-[14px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20 whitespace-nowrap">
            {s}
          </span>
        )) : <span className="text-slate-400 text-sm">{placeholder}</span>}
        {!disabled && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm lg:text-es">▾</span>}
      </button>
      {open && !disabled && (
        <div className={`absolute z-50 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-3 max-h-48 overflow-y-auto ${position === 'top' ? 'bottom-full mb-2' : 'mt-1 top-full'}`}>
          {options.map(s => (
            <label key={s} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0297d6] text-md lg:text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={selected.includes(s)}
                onChange={() => toggle(s)}
                className="accent-[#0297d6]"
              />
              {s}
            </label>
          ))}
          {allowCustom && selected.includes('Other') && (
            <input
              type="text"
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              placeholder="Enter custom value..."
              className="mt-2 w-full px-3 py-2 bg-slate-50 rounded-xl text-md lg:text-sm border border-slate-200 outline-none focus:border-[#0297d6]"
            />
          )}
        </div>
      )}
    </div>
  );
};

const SingleSelect = ({
  options, value, onChange, placeholder, disabled = false, position = 'bottom'
}: {
  options: string[]; value: string; onChange: (v: string) => void;
  placeholder: string; disabled?: boolean; position?: 'top' | 'bottom';
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className="w-full px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-left flex justify-between items-center disabled:opacity-60"
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <span className="text-slate-400 text-xs">▾</span>
      </button>
      {open && !disabled && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-2 max-h-48 overflow-y-auto ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-1'}`}>
            {options.map(s => (
              <div
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-50 hover:text-[#0297d6] rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                {s}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
const EZShifaPortal = () => {
  // ─── State Variables ───────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenEditMode, setTokenEditMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [prescriptionGenerated, setPrescriptionGenerated] = useState(false);
  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }
  ]);
  const [notes, setNotes] = useState('');
  const [regSpecs, setRegSpecs] = useState<string[]>([]);
  const [regQuals, setRegQuals] = useState<string[]>([]);
  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedLogoutReason, setSelectedLogoutReason] = useState('');
  const [doctor, setDoctor] = useState<DoctorProfile>({
    title: 'Dr.', firstName: 'Muhammad', lastName: 'Umer',
    email: 'umer.dev@example.com', password: 'password123',
    phone: '+92 300 1234567', gender: 'Male',
    specializations: ['General Physician'], qualifications: ['MBBS', 'MD'],
    experience: '5', city: 'Karachi', photo: '',
  });

  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;

  // ─── Static Data ───────────────────────────────────────────────────────────
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

  // ─── Helper Functions ──────────────────────────────────────────────────────
  const updateMedicine = (id: number, field: string, value: any) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    if (selectedLogoutReason) {
      setShowLogoutModal(false);
      setIsLoggedIn(false);
      setActivePage('login');
      setSelectedLogoutReason(''); // reset for next time
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setSelectedLogoutReason('');
  };

  // ─── Input Helpers (controlled) ────────────────────────────────────────────
  const field = (key: keyof DoctorProfile, type = 'text', placeholder = '') => (
    <input
      type={type}
      value={doctor[key] as string}
      placeholder={placeholder}
      disabled={!editMode}
      onChange={e => setDoctor(d => ({ ...d, [key]: e.target.value }))}
      className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none disabled:opacity-60 disabled:cursor-default w-full"
    />
  );

  const selectField = (key: keyof DoctorProfile, options: string[], placeholder = '') => (
    <select
      value={doctor[key] as string}
      disabled={!editMode}
      onChange={e => setDoctor(d => ({ ...d, [key]: e.target.value }))}
      className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-600 disabled:opacity-60 disabled:cursor-default w-full"
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  // ─── Sub-Component: Navbar ─────────────────────────────────────────────────
  const Navbar = () => (
    <nav className="bg-[#0297d6] sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-md text-white">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => { setActivePage('dashboard'); setSelectedPatient(null); }}
      >
        <div className="flex flex-col leading-none">
          <span className="text-white font-black text-lg tracking-tighter uppercase">Doctor's Portal</span>
          <span className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em]">EZShifa Digital Clinic</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black uppercase">{fullName}</p>
          <button onClick={handleLogout} className="text-[10px] font-bold opacity-80 hover:opacity-100 flex items-center gap-1 ml-auto">
            <LogOut size={12} /> LOGOUT
          </button>
        </div>
        <img
          src={doctor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=fff&color=0297d6`}
          onClick={() => setActivePage('profile')}
          className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/30 hover:border-white transition-all object-cover"
          alt="Profile"
        />
      </div>
    </nav>
  );

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER - SINGLE MAIN RETURN STRUCTURE (with conditional auth view)
  // ────────────────────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-4xl shadow-2xl w-full overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT PANEL */}
          <div className="bg-[#0297d6] lg:w-80 shrink-0 px-8 py-6 flex flex-col items-center justify-between gap-4">
            <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-center">
              <img src="/logo.png" alt="EZShifa Logo" className="max-w-48 h-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-[#0297d6] font-black text-2xl hidden">EZShifa</span>
            </div>
            <div className="text-white text-center">
              <h2 className="text-3xl font-black leading-snug">Digital Health Clinic</h2>
              <p className="text-sm opacity-75 font-semibold mt-1">Professional healthcare network, Karachi.</p>
            </div>
            <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">© 2026 EZShifa</div>
          </div>
          {/* RIGHT PANEL */}
          <div className="flex-1 px-8 py-8 lg:py-1 lg:mb-2 overflow-y-auto max-h-[90vh]">
            {activePage === 'login' ? (
              <>
                <h1 className="text-4xl font-black text-slate-800">Welcome Back</h1>
                <p className="text-slate-400 font-semibold text-sm mt-1 mb-6">Login to your dashboard</p>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); setIsLoggedIn(true); setActivePage('dashboard'); }}>
                  <input type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-base border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                  <input type="password" placeholder="Password" className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-base border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                  <button className="w-full bg-[#0297d6] text-white py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-md mt-6">Login</button>
                </form>
                <button onClick={() => setActivePage('signup')} className="w-full mt-4 text-xs font-black text-slate-700 hover:text-[#0297d6] uppercase tracking-widest">
                  Create an account →
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-black text-slate-800">Doctor Registration</h1>
                <p className="text-slate-400 font-semibold text-sm mt-0.5 mb-4">Create your professional profile</p>
                <form className="space-y-3" onSubmit={e => { e.preventDefault(); setIsLoggedIn(true); setActivePage('dashboard'); }}>
                  {/* Photo */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profilePreview
                        ? <img src={profilePreview} className="w-full h-full object-cover" alt="preview" />
                        : <User size={20} className="text-slate-400" />}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-xs font-black text-[#0297d6] uppercase tracking-widest">Upload Photo</span>
                      <span className="text-[11px] text-slate-400 ml-2">(Optional)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setProfilePreview(URL.createObjectURL(f));
                      }} />
                    </label>
                  </div>
                  {/* Name */}
                  <div className="grid grid-cols-3 gap-2">
                    <select defaultValue="" className="px-2 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-600">
                      <option value="" disabled>Title</option>
                      {TITLE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input type="text" placeholder="First Name" required className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                    <input type="text" placeholder="Last Name" required className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                  </div>
                  {/* Email + Password */}
                  <div className="grid grid-cols-2 gap-2">
                    <input type="email" placeholder="Email Address" required className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                    <input type="password" placeholder="Password" required className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                  </div>
                  {/* Phone + Gender */}
                  <div className="grid grid-cols-2 gap-2">
                    <input type="tel" placeholder="Phone Number" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                    <select defaultValue="" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-500">
                      <option value="" disabled>Gender</option>
                      {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  {/* Professional */}
                  <p className="text-[12px] font-black text-[#0297d6] uppercase tracking-widest pt-1">Professional Info</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <MultiSelect options={SPECIALIZATION_OPTIONS} selected={regSpecs} onChange={setRegSpecs} placeholder="Specialization" allowCustom />
                    <MultiSelect options={QUALIFICATION_OPTIONS} selected={regQuals} onChange={setRegQuals} placeholder="Qualification" allowCustom />
                    <input type="number" placeholder="Experience (Yrs)" min={0} max={60} className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                    <select defaultValue="" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-500">
                      <option value="" disabled>City</option>
                      {CITY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <button className="w-full bg-[#0297d6] text-white py-2 rounded-2xl font-black uppercase tracking-widest text-md lg:text-sm shadow-md">Register Now</button>
                </form>
                <button onClick={() => setActivePage('login')} className="w-full mt-2 text-[10px] font-black text-slate-700 hover:text-[#0297d6] uppercase tracking-widest">
                  ← Back to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LOGGED-IN VIEW (Dashboard + Patient Detail + Profile) ─────────────────
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 lg:p-1">
        {/* ── DASHBOARD ── */}
        {activePage === 'dashboard' && !selectedPatient && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pt-4 mx-4">
              {[
                { label: 'Today Patients', val: '24', icon: User, bg: 'bg-blue-50', text: 'text-blue-600' },
                { label: 'In Queue', val: '08', icon: Clock, bg: 'bg-orange-50', text: 'text-orange-600' },
                { label: 'Completed', val: '16', icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.text}`}>
                    <s.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] lg:text-[16px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-2xl lg:text-3xl font-black text-slate-800">{s.val}</h3>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 lg:mx-4">
              <div className="p-2 border-b border-slate-50 font-black text-slate-800 uppercase tracking-widest text-lg">
                Current Patient Queue
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[13px] lg:text-[14px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">SR. No</th>
                    <th className="px-6 py-4">
                      {tokenEditMode ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus type="text" value={tokenSearch} onChange={e => setTokenSearch(e.target.value)}
                            onBlur={() => { if (!tokenSearch) setTokenEditMode(false); }}
                            placeholder="Search token..."
                            className="px-3 py-1 rounded-xl border-2 border-[#0297d6] outline-none text-[#0297d6] font-black text-xs w-36 bg-white" />
                          {tokenSearch && <button onClick={() => { setTokenSearch(''); setTokenEditMode(false); }}><X size={14} /></button>}
                        </div>
                      ) : (
                        <button onClick={() => setTokenEditMode(true)} className="hover:text-[#0297d6] flex items-center gap-1">
                          Token Number <Search size={12} />
                        </button>
                      )}
                    </th>
                    <th className="px-6 py-4">Symptoms</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {queue.filter(p => !tokenSearch || p.token.includes(tokenSearch)).map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-5 font-bold text-slate-500">{i + 1}</td>
                      <td className="px-6 py-5 font-black text-[#0297d6]">#{p.token}</td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{p.symptoms}</td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => setSelectedPatient(p)}
                          className="bg-[#0297d6] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                          Start
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PATIENT DETAIL ── */}
        {selectedPatient && activePage === 'dashboard' && (
          <div className="lg:mt-2 lg:mx-4 lg:pb-8">

            {/* Back Button */}
            <button
              onClick={() => setSelectedPatient(null)}
              className="mb-6 bg-[#0297d6] text-white py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#0288c2] transition-all"
            >
              ← Back to Queue
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

              {/* LEFT PANEL - Patient Info + Vitals (Single column on mobile/tablet) */}
              <div className="lg:col-span-5 bg-slate-50 p-6 lg:p-8 rounded-[2.5rem]">

                {/* PATIENT HEADER - Matches your new image style */}
                <div className="flex gap-30 lg:gap-10 mb-8 bg-white p-5 rounded-3xl shadow-sm">

                  {/* Icon on the left */}
                  <div className="w-25 h-25 bg-slate-100 rounded-2xl flex items-center justify-center text-[#0297d6] shrink-0">
                    <User size={72} />
                  </div>

                  {/* Info on the right - Name, Age, Gender */}
                  <div className="flex-1">
                    {/* Name - On its own line */}
                    <div className="mb-3">
                      <span className="text-lg lg:text-xs font-black text-slate-400 uppercase tracking-widest">NAME: </span>
                      <span className="text-2xl lg:text-sm font-black text-slate-900">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </span>
                    </div>

                    {/* Age + Gender - Single Line */}
                    <div className="flex gap-6">
                      <div>
                        <span className="text-lg lg:text-xs font-black text-slate-400 uppercase tracking-widest">AGE: </span>
                        <span className="text-2xl lg:text-sm font-semibold text-slate-700">
                          {selectedPatient.age} Years
                        </span>
                      </div>

                      <div>
                        <span className="text-lg lg:text-xs font-black text-slate-400 uppercase tracking-widest">GENDER: </span>
                        <span className="text-2xl lg:text-sm font-semibold text-slate-700">
                          {selectedPatient.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Current Symptoms */}
                <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">CURRENT SYMPTOMS</p>
                  <p className="text-sm font-bold text-red-500">{selectedPatient.symptoms}</p>
                </div>

                {/* Vitals - 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedPatient.vitals).map(([k, v]) => (
                    <div key={k} className="bg-white p-4 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{k.toUpperCase()}</p>
                      <p className="text-base font-black text-slate-800 mt-1">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT PANEL - Prescription Builder */}
              <div className="lg:col-span-7 bg-white border border-slate-100 p-6 lg:p-8 rounded-[2.5rem] shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Pill className="text-[#0297d6]" /> Prescription Builder
                </h3>
                {/* Medicine Rows */}
                <div className="space-y-3 mb-4">
                  {medicines.map((med) => (
                    <div key={med.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl relative group hover:border-[#0297d6]/20 transition-all">
                      <button
                        onClick={() => setMedicines(medicines.filter(m => m.id !== med.id))}
                        className="absolute -right-2 -top-2 bg-white border border-slate-200 text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 shadow transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          placeholder="Medicine Name"
                          className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0297d6] font-bold text-sm"
                          value={med.name}
                          onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                        />
                        <select
                          className="p-3 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 text-sm"
                          value={med.meal}
                          onChange={(e) => updateMedicine(med.id, 'meal', e.target.value)}
                        >
                          <option>After Meal</option>
                          <option>Before Meal</option>
                        </select>
                      </div>
                      <div className="flex gap-6 items-center pl-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</span>
                        {['morning', 'afternoon', 'night'].map(time => (
                          <label key={time} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-[#0297d6]"
                              // checked={!!med[time]}
                              onChange={(e) => updateMedicine(med.id, time, e.target.checked)}
                            />
                            <span className="text-xs font-black text-slate-500 uppercase">{time}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setMedicines([...medicines, { id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }])}
                  className="mb-4 bg-[#0297d6]/10 text-[#0297d6] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#0297d6]/20 transition-all"
                >
                  + Add Medicine
                </button>
                {/* Clinical Notes */}
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical remarks, lifestyle advice..."
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#0297d6] focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm mb-6"
                />
                {/* Action Buttons - always visible */}
                <div className="flex gap-3 print:hidden">
                  <button
                    onClick={() => setPrescriptionGenerated(true)}
                    className="flex-1 bg-[#0297d6] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0297d6]/80 transition-all"
                  >
                    <Pill size={16} /> Generate Prescription
                  </button>
                  <button
                    onClick={() => { setSelectedPatient(null); setMedicines([{ id: Date.now(), name: '', morning: false, afternoon: false, night: false, meal: 'After Meal' }]); setNotes(''); setPrescriptionGenerated(false); }}
                    className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-300 transition-all"
                  >
                    End Session
                  </button>
                </div>
                {/* Printable Prescription — only after Generate is clicked */}
                {prescriptionGenerated && (
                  <>
                    <div id="prescription-paper" className="bg-white border border-slate-100 rounded-2xl p-6 mt-6 mb-4 print:shadow-none">
                      {/* Header: Logo + Title + Rx */}
                      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <img
                            src="/logo2.png"
                            alt="EZShifa"
                            className="h-18 w-auto"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-slate-700 uppercase tracking-widest">Prescription</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">EZShifa Digital Health</p>
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-black text-slate-200 italic leading-none">Rx</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Date: {new Date().toLocaleDateString()}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Token: #{selectedPatient.token}</p>
                        </div>
                      </div>
                      {/* Patient Info — form style like the image */}
                      <div className="mb-5 space-y-3 border-b border-slate-100 pb-5">
                        <div className="flex items-end gap-2">
                          <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Patient Name:</span>
                          <span className="flex-1 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                          <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap ml-4">Date:</span>
                          <span className="w-28 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Age:</span>
                          <span className="w-20 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.age} Yrs</span>
                          <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap ml-4">Gender:</span>
                          <span className="w-24 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.gender}</span>
                          <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap ml-4">Weight:</span>
                          <span className="w-24 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.vitals.weight}</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Diagnosis:</span>
                          <span className="flex-1 border-b border-slate-300 pb-0.5 font-bold text-slate-800 text-sm">{selectedPatient.symptoms}</span>
                        </div>
                      </div>
                      {/* Physician */}
                      <div className="text-right mb-4">
                        <p className="text-[9px] font-black text-[#0297d6] uppercase tracking-widest">Attending Physician</p>
                        <p className="font-black text-slate-800">{fullName}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase">{doctor.specializations.join(', ')}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{doctor.qualifications.join(', ')}</p>
                      </div>
                      {/* Medicines Table */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden mb-4">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                              <th className="px-4 py-3">Medicine</th>
                              <th className="px-4 py-3 text-center">M — A — N</th>
                              <th className="px-4 py-3">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {medicines.filter(m => m.name).map((m, i) => (
                              <tr key={i}>
                                <td className="px-4 py-3 font-black text-sm text-slate-800">{m.name}</td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center gap-1">
                                    {[m.morning, m.afternoon, m.night].map((active, idx) => (
                                      <span key={idx} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold border ${active ? 'bg-[#0297d6] border-[#0297d6] text-white' : 'border-slate-200 text-slate-300'}`}>
                                        {active ? '1' : '0'}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-bold text-[#0297d6] italic uppercase">{m.meal}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Notes */}
                      {notes && (
                        <div className="p-4 bg-blue-50/50 border-l-4 border-[#0297d6] rounded-r-xl mb-4">
                          <p className="text-[10px] font-black text-[#0297d6] uppercase tracking-widest mb-1">Clinical Notes</p>
                          <p className="text-sm italic text-slate-700 font-medium">{notes}</p>
                        </div>
                      )}
                      {/* Footer */}
                      <div className="border-t pt-4 flex justify-between items-center opacity-50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">System Generated — EZShifa Digital Health</p>
                        <div className="h-10 w-24 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center">
                          <span className="text-[8px] text-slate-400 font-bold uppercase">Doctor's Stamp</span>
                        </div>
                      </div>
                    </div>
                    {/* Print / Download buttons — only after generation */}
                    <div className="flex gap-3 print:hidden">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0297d6] transition-all"
                      >
                        <Printer size={16} /> Print Rx
                      </button>
                      <button
                        className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                      >
                        Save PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activePage === 'profile' && (
          <div className="max-w-3xl mx-auto pb-0">
            <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
              {/* Blue Header */}
              <div className="bg-[#0297d6] px-8 py-3 relative flex flex-col sm:flex-row items-center gap-6">
                <button
                  onClick={() => setEditMode(v => !v)}
                  className="absolute right-6 top-6 bg-white/20 p-2 rounded-xl text-white hover:bg-white/40 transition-colors"
                >
                  {editMode ? <X size={18} /> : <Edit2 size={18} />}
                </button>
                {/* Avatar */}
                <div className="relative group">
                  <img
                    src={doctor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffffff&color=0297d6`}
                    className="w-24 h-24 rounded-4xl border-4 border-white/30 shadow-lg object-cover"
                    alt="Profile"
                  />
                  {editMode && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-4xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-black uppercase">Change</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setDoctor(d => ({ ...d, photo: URL.createObjectURL(f) }));
                      }} />
                    </label>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-black text-white">{fullName}</h1>
                  <p className="text-white/80 font-bold uppercase text-xs mt-1">
                    {doctor.specializations.join(' • ') || 'No specialization set'}
                  </p>
                </div>
              </div>
              {/* White content */}
              <div className="px-6 sm:px-10 py-5 bg-white space-y-2.5">
                {/* Row 1: Title + First + Last — same 3-col layout as registration */}
                <div className="grid grid-cols-3 gap-2">
                  {selectField('title', TITLE_OPTIONS)}
                  {field('firstName', 'text', 'First Name')}
                  {field('lastName', 'text', 'Last Name')}
                </div>
                {/* Row 2: Email + Password */}
                <div className="grid grid-cols-2 gap-2">
                  {field('email', 'email', 'Email')}
                  {field('password', 'password', 'Password')}
                </div>
                {/* Row 3: Phone + Gender */}
                <div className="grid grid-cols-2 gap-2">
                  {field('phone', 'tel', 'Phone')}
                  {selectField('gender', GENDER_OPTIONS)}
                </div>
                {/* Professional heading */}
                <p className="text-[14px] font-black text-[#0297d6] uppercase tracking-widest pt-2">
                  Professional Information
                </p>
                {/* Row 4: Spec + Qual + Exp + City — identical 4-col to registration */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <MultiSelect
                    options={SPECIALIZATION_OPTIONS}
                    selected={doctor.specializations}
                    onChange={v => setDoctor(d => ({ ...d, specializations: v }))}
                    placeholder="Specialization"
                    disabled={!editMode}
                    allowCustom
                    position='top'
                  />
                  <MultiSelect
                    options={QUALIFICATION_OPTIONS}
                    selected={doctor.qualifications}
                    onChange={v => setDoctor(d => ({ ...d, qualifications: v }))}
                    placeholder="Qualification"
                    disabled={!editMode}
                    allowCustom
                    position='top'
                  />
                  <input
                    type="number"
                    value={doctor.experience}
                    placeholder="Experience (Yrs)"
                    disabled={!editMode}
                    min={0} max={60}
                    onChange={e => setDoctor(d => ({ ...d, experience: e.target.value }))}
                    className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none disabled:opacity-60 disabled:cursor-default"
                  />
                  <SingleSelect
                    options={CITY_OPTIONS}
                    value={doctor.city}
                    onChange={v => setDoctor(d => ({ ...d, city: v }))}
                    placeholder="Select City"
                    disabled={!editMode}
                    position="top"
                  />
                </div>
                {/* Save button */}
                {editMode && (
                  <button
                    onClick={() => setEditMode(false)}
                    className="w-full bg-[#0297d6] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md"
                  >
                    Update Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* LOGOUT MODAL */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-9999 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-5 pb-3 border-b flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">
                  Please select reason of logging out
                </h2>
                <button
                  onClick={cancelLogout}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Radio Options */}
              <div className="p-6 space-y-3 max-h-105 overflow-y-auto">
                {LOGOUT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="logoutReason"
                      checked={selectedLogoutReason === reason}
                      onChange={() => setSelectedLogoutReason(reason)}
                      className="w-5 h-5 accent-[#0297d6] cursor-pointer"
                    />
                    <span className="text-slate-700 font-medium group-hover:text-[#0297d6] transition-colors">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>

              {/* Confirm Button */}
              <div className="px-6 py-5 border-t bg-slate-50">
                <button
                  onClick={confirmLogout}
                  disabled={!selectedLogoutReason}
                  className="w-full bg-[#0297d6] hover:bg-[#0288c2] disabled:bg-slate-300 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all text-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Print Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: white; }
        @media print {
          body * { visibility: hidden; }
          #prescription-paper, #prescription-paper * { visibility: visible; }
          #prescription-paper {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 20px !important;
            box-shadow: none !important; border: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default EZShifaPortal;