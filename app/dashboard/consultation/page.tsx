"use client";
import React, { useState, useEffect } from 'react';
import {
  Stethoscope, LogOut, Trash2, Printer, Download,
  Search, User, CheckCircle, Clock, Pill,
  GraduationCap, Briefcase, MapPin,
  Phone, Mail, Lock, Activity, Settings, Edit2, X
} from 'lucide-react';

// --- Interfaces ---
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

type Page = 'login' | 'signup' | 'dashboard' | 'profile';

const EZShifaPortal = () => {
  const [activePage, setActivePage] = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [specDropOpen, setSpecDropOpen] = useState(false);
  const [qualDropOpen, setQualDropOpen] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedQuals, setSelectedQuals] = useState<string[]>([]);

  // --- Doctor State (Simulating Session) ---
  const [doctorProfile, setDoctorProfile] = useState({
    name: "Dr. Muhammad Umer",
    email: "umer.dev@example.com",
    phone: "+92 300 1234567",
    gender: "Male",
    specialization: "General Physician",
    qualification: "MBBS, MD",
    experience: "5",
    country: "Pakistan",
    city: "Karachi",
    photo: ""
  });

  // --- Mock Queue Data ---
  const [queue] = useState<Patient[]>([
    {
      id: 1, token: "101", firstName: "Ahmed", lastName: "Khan", age: 45, gender: "Male",
      symptoms: "Persistent Cough, Fever", medicalHistory: "Type 2 Diabetes",
      vitals: { temp: "101.2°F", bp: "130/85", pulse: "88 bpm", weight: "75kg" }
    },
    {
      id: 2, token: "102", firstName: "Sara", lastName: "Ahmed", age: 29, gender: "Female",
      symptoms: "Severe Headache", medicalHistory: "Migraine",
      vitals: { temp: "98.4°F", bp: "110/70", pulse: "72 bpm", weight: "60kg" }
    }
  ]);

  const handleLogout = () => {
    const reason = prompt("Please enter reason for logout (e.g., Shift Ended, Emergency, Break):");
    if (reason !== null) {
      console.log(`Logout Reason: ${reason}`);
      setIsLoggedIn(false);
      setActivePage('login');
    }
  };

  const Navbar = () => (
    <nav className="bg-[#0297d6] sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-md text-white">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActivePage('dashboard'); setSelectedPatient(null); }}>
        <div className="bg-white p-2 rounded-xl text-[#0297d6]">
          <Stethoscope size={22} />
        </div>
        <img src="/logo.png" alt="EZShifa" className="h-8 w-auto bg-black rounded-lg px-2 py-0.5" />
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black uppercase">{doctorProfile.name}</p>
          <button onClick={handleLogout} className="text-[10px] font-bold opacity-80 hover:opacity-100 flex items-center gap-1 ml-auto">
            <LogOut size={12} /> LOGOUT
          </button>
        </div>
        <img
          src={doctorProfile.photo || `https://ui-avatars.com/api/?name=${doctorProfile.name}&background=fff&color=0297d6`}
          onClick={() => setActivePage('profile')}
          className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white/30 hover:border-white transition-all object-cover"
          alt="Profile"
        />
      </div>
    </nav>
  );

  // --- Auth Views ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full overflow-hidden flex flex-col lg:flex-row">

          {/* LEFT PANEL */}
          <div className="bg-[#0297d6] lg:w-85 shrink-0 px-8 py-6 flex flex-col lg:flex-col items-center justify-between gap-4">
            <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-center">
              <img src="/logo.png" alt="EZShifa Logo" className="max-w-50 lg:max-w-39.5 h-auto" />
            </div>
            <div className="text-white text-center lg:text-right">
              <h2 className="text-4xl lg:text-3xl font-black leading-snug">Digital Health Clinic</h2>
              <p className="text-[14px] opacity-75 font-semibold mt-1">Professional healthcare network, Karachi.</p>
            </div>
            <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest hidden lg:block">© 2026 EZShifa</div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 px-8 py-8 overflow-y-auto max-h-[90vh]">
            {activePage === 'login' ? (
              <>
                <h1 className="text-4xl font-black p-0 text-slate-800">Welcome Back</h1>
                <p className="text-slate-400 font-semibold text-sm mt-1 mb-6">Login to your dashboard</p>
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setActivePage('dashboard'); }}>
                  <input type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-xl lg:text-base border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                  <input type="password" placeholder="Password" className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-xl lg:text-base border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                  <button className="w-full bg-[#0297d6] text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-md shadow-md mt-6">Login</button>
                </form>
                <button onClick={() => setActivePage('signup')} className="w-full mt-4 text-[12px] font-black text-slate-700 hover:text-[#0297d6] uppercase tracking-widest">Create an account →</button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-black text-slate-800">Doctor Registration</h1>
                <p className="text-slate-400 font-semibold text-xs mt-0.5 mb-3">Create your professional profile</p>
                <form className="space-y-2.5" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setActivePage('dashboard'); }}>

                  {/* Profile Picture */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border-2 border-transparent">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profilePreview
                        ? <img src={profilePreview} className="w-full h-full object-cover" alt="preview" />
                        : <User size={20} className="text-slate-400" />
                      }
                    </div>
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-xs font-black text-[#0297d6] uppercase tracking-widest">Upload Photo</span>
                        <span className="text-[10px] text-slate-400 font-medium ml-2">(Optional)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProfilePreview(URL.createObjectURL(file));
                        }} />
                      </label>
                      <p className="text-[10px] text-slate-400">JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-2">
                      <select
                        defaultValue=""
                        className="w-24 px-2 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-600"
                      >
                        <option value="" disabled>Title</option>
                        <option>Dr.</option>
                        <option>Mr.</option>
                        <option>Ms.</option>
                        <option>Mrs.</option>
                        <option>Prof.</option>
                        <option>Assoc. Prof.</option>
                      </select>

                      <input
                        type="text"
                        placeholder="First Name"
                        className="flex-1 px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none"
                        required
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Last Name"
                      className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none"
                      required
                    />
                  </div>

                  {/* Email & Password */}
                  <div className="grid grid-cols-2 gap-2">
                    <input type="email" placeholder="Email Address" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                    <input type="password" placeholder="Password" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                  </div>

                  {/* Phone & Gender */}
                  <div className="grid grid-cols-2 gap-2">
                    <input type="tel" placeholder="Phone Number" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                    <select defaultValue="" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-500">
                      <option value="" disabled>Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Professional Info */}
                  <p className="text-[9px] font-black text-[#0297d6] uppercase tracking-widest pt-1">Professional Info</p>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                    {/* Specialization - multi checkbox dropdown */}
                    <div className="relative">
                      <button type="button" onClick={() => setSpecDropOpen(v => !v)}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-left text-slate-500 flex justify-between items-center">
                        <span>{selectedSpecs.length ? selectedSpecs.join(', ') : 'Specialization'}</span>
                        <span className="text-slate-400 text-xs">▾</span>
                      </button>
                      {specDropOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-3 max-h-44 overflow-y-auto">
                          {['General Physician', 'Cardiologist', 'Dermatologist', 'ENT', 'Gynecologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Urologist'].map(s => (
                            <label key={s} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0297d6] text-sm font-medium text-slate-600">
                              <input type="checkbox" checked={selectedSpecs.includes(s)} onChange={() => setSelectedSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} className="accent-[#0297d6]" />
                              {s}
                            </label>
                          ))}
                          <label className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0297d6] text-sm font-medium text-slate-600">
                            <input type="checkbox" checked={selectedSpecs.includes('Other')} onChange={() => setSelectedSpecs(p => p.includes('Other') ? p.filter(x => x !== 'Other') : [...p, 'Other'])} className="accent-[#0297d6]" />
                            Other
                          </label>
                          {selectedSpecs.includes('Other') && (
                            <input type="text" placeholder="Enter specialization..." className="mt-1 w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none focus:border-[#0297d6]" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Qualification - multi checkbox dropdown */}
                    <div className="relative">
                      <button type="button" onClick={() => setQualDropOpen(v => !v)}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-left text-slate-500 flex justify-between items-center">
                        <span>{selectedQuals.length ? selectedQuals.join(', ') : 'Qualification'}</span>
                        <span className="text-slate-400 text-xs">▾</span>
                      </button>
                      {qualDropOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-3 max-h-44 overflow-y-auto">
                          {['MBBS', 'BDS', 'MD', 'MS', 'FCPS', 'MRCP', 'MRCS', 'PhD', 'DPT', 'Pharm-D'].map(q => (
                            <label key={q} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0297d6] text-sm font-medium text-slate-600">
                              <input type="checkbox" checked={selectedQuals.includes(q)} onChange={() => setSelectedQuals(p => p.includes(q) ? p.filter(x => x !== q) : [...p, q])} className="accent-[#0297d6]" />
                              {q}
                            </label>
                          ))}
                          <label className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0297d6] text-sm font-medium text-slate-600">
                            <input type="checkbox" checked={selectedQuals.includes('Other')} onChange={() => setSelectedQuals(p => p.includes('Other') ? p.filter(x => x !== 'Other') : [...p, 'Other'])} className="accent-[#0297d6]" />
                            Other
                          </label>
                          {selectedQuals.includes('Other') && (
                            <input type="text" placeholder="Enter qualification..." className="mt-1 w-full px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none focus:border-[#0297d6]" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Experience & City */}
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Experience (Years)" min="0" max="60"
                        className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
                      <select defaultValue="" className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-500">
                        <option value="" disabled>City</option>
                        {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana', 'Abbottabad', 'Mardan', 'Mingora', 'Rahim Yar Khan', 'Sahiwal'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button className="w-full bg-[#0297d6] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md">Register Now</button>
                </form>
                <button onClick={() => setActivePage('login')} className="w-full mt-2 mb-1 text-[10px] font-black text-slate-400 hover:text-[#0297d6] uppercase tracking-widest">← Back to Login</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 lg:p-10">

        {/* Dashboard */}
        {activePage === 'dashboard' && !selectedPatient && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { label: 'Today Patients', val: '24', icon: User, bg: 'bg-blue-50', text: 'text-blue-600' },
                { label: 'In Queue', val: '08', icon: Clock, bg: 'bg-orange-50', text: 'text-orange-600' },
                { label: 'Completed', val: '16', icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.text}`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-2xl font-black text-slate-800">{stat.val}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 font-black text-slate-800 uppercase tracking-widest text-sm">
                Current Patient Queue
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">SR. No</th>
                    <th className="px-6 py-4">Token Number</th>
                    <th className="px-6 py-4">Symptoms</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {queue.map((p, index) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-5 font-bold text-slate-500">{index + 1}</td>
                      <td className="px-6 py-5 font-black text-[#0297d6]">#{p.token}</td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">{p.symptoms}</td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          className="bg-[#0297d6] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
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

        {/* Patient Details View (Internal Consultation) */}
        {selectedPatient && activePage === 'dashboard' && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <button onClick={() => setSelectedPatient(null)} className="mb-6 flex items-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-slate-800 transition-colors">
              <X size={16} /> Back to Queue
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-slate-50 p-8 rounded-[2.5rem]">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center text-[#0297d6] shadow-sm mb-4">
                    <User size={32} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                  <p className="text-[#0297d6] font-black text-[10px] uppercase">{selectedPatient.gender} • {selectedPatient.age} Years</p>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Current Symptoms</p>
                    <p className="text-sm font-bold text-red-500">{selectedPatient.symptoms}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedPatient.vitals).map(([k, v]) => (
                      <div key={k} className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase">{k}</p>
                        <p className="text-xs font-black text-slate-800">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                  <Pill className="text-[#0297d6]" /> Prescription Box
                </h3>
                <textarea placeholder="Type medicines or clinical notes here..." className="w-full h-64 p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-[#0297d6] outline-none font-medium text-slate-700" />
                <div className="flex gap-4 mt-8">
                  <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                    <Printer size={18} /> Print Rx
                  </button>
                  <button className="flex-1 bg-[#0297d6] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">
                    Complete Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile View */}
        {activePage === 'profile' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
              <div className="h-32 bg-[#0297d6] relative">
                <button className="absolute right-6 top-6 bg-white/20 p-2 rounded-xl text-white hover:bg-white/40">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="px-10 pb-12 -mt-16">
                <img
                  src={doctorProfile.photo || `https://ui-avatars.com/api/?name=${doctorProfile.name}&background=f8fafc&color=0297d6`}
                  className="w-32 h-32 rounded-[2.5rem] border-8 border-white bg-slate-100 shadow-lg object-cover mb-6"
                  alt="Profile"
                />
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">{doctorProfile.name}</h1>
                <p className="text-[#0297d6] font-black uppercase text-sm tracking-widest mb-10">{doctorProfile.specialization}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Qualification', val: doctorProfile.qualification, icon: GraduationCap },
                    { label: 'Experience', val: doctorProfile.experience + " Years", icon: Briefcase },
                    { label: 'Contact', val: doctorProfile.phone, icon: Phone },
                    { label: 'Email', val: doctorProfile.email, icon: Mail },
                    { label: 'Location', val: `${doctorProfile.city}, ${doctorProfile.country}`, icon: MapPin },
                    { label: 'Gender', val: doctorProfile.gender, icon: User },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="p-3 bg-blue-50 text-[#0297d6] rounded-xl"><item.icon size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-sm font-bold text-slate-700">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: white; }
      `}</style>
    </div>
  );
};

export default EZShifaPortal;