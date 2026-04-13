// consultation/docSignup.tsx
"use client";
import React, { useState } from 'react';
import { User } from 'lucide-react'; // ✅ Fixed: Import User icon
import { apiService } from '@/app/_utils/apiService';
// ✅ Import from the correct file (doctor_registration.ts)
import {
  TITLE_OPTIONS,
  GENDER_OPTIONS,
  SPECIALIZATION_OPTIONS,
  QUALIFICATION_OPTIONS,
  CITY_OPTIONS,
} from './doctor_registration';

import { MultiSelect } from './components/MultiSelect';

interface DocSignupProps {
  setActivePage: React.Dispatch<React.SetStateAction<'login' | 'signup' | 'dashboard' | 'profile'>>;
}

const DocSignup: React.FC<DocSignupProps> = ({ setActivePage }) => {
  const [regSpecs, setRegSpecs] = useState<string[]>([]);
  const [regQuals, setRegQuals] = useState<string[]>([]);
  const [profilePreview, setProfilePreview] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // form field states
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [experience, setExperience] = useState('');
  const [city, setCity] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phone', phone);
      formData.append('gender', gender);
      formData.append('experience', experience);
      formData.append('city', city);
      formData.append('specializations', JSON.stringify(regSpecs));
      formData.append('qualifications', JSON.stringify(regQuals));
      if (profileFile) formData.append('photo', profileFile);

      await apiService.docRegister(formData);

      // Success handling
      setSuccess('Registration successful! Redirecting to sign-in...');

      // Show blue message for 1.5 seconds then go to doctor login screen
      setTimeout(() => {
        setActivePage('login');   // ← goes to doctor sign-in screen
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-4xl shadow-2xl w-full overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="bg-[#0297d6] lg:w-80 shrink-0 px-8 py-6 flex flex-col items-center justify-between gap-4">
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="EZShifa Logo"
              className="max-w-48 h-auto"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="text-white text-center">
            <h2 className="text-3xl font-black leading-snug">Digital Health Clinic</h2>
            <p className="text-sm opacity-75 font-semibold mt-1">Professional healthcare network, Karachi.</p>
          </div>
          <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">© 2026 EZShifa</div>
        </div>

        {/* Right Panel - Signup Form */}
        <div className="flex-1 px-8 py-8 lg:py-1 lg:mb-2 overflow-y-auto max-h-[90vh]">
          <h1 className="text-2xl font-black text-slate-800">Doctor Registration</h1>
          <p className="text-slate-400 font-semibold text-sm mt-0.5 mb-4">Create your professional profile</p>

          <form className="space-y-3" onSubmit={handleRegister}>
            {/* Photo Upload */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {profilePreview ? (
                  <img src={profilePreview} className="w-full h-full object-cover" alt="preview" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <label className="cursor-pointer">
                <span className="text-xs font-black text-[#0297d6] uppercase tracking-widest">Upload Photo</span>
                <span className="text-[11px] text-slate-400 ml-2">(Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setProfilePreview(URL.createObjectURL(f)); setProfileFile(f); }
                  }}
                />
              </label>
            </div>

            {/* Name Fields */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl text-sm font-semibold">
                {success}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <select value={title} onChange={e => setTitle(e.target.value)} required
                className="px-2 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-600"
              >
                <option value="" disabled>Title</option>
                {TITLE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="text" placeholder="First Name" required value={firstName} onChange={e => setFirstName(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
              <input type="text" placeholder="Last Name" required value={lastName} onChange={e => setLastName(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
              <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-500"
              >
                <option value="" disabled>Gender</option>
                {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            {/* Professional Info */}
            <p className="text-[12px] font-black text-[#0297d6] uppercase tracking-widest pt-1">Professional Info</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <MultiSelect
                options={SPECIALIZATION_OPTIONS.map(opt => opt.value)}
                selected={regSpecs}
                onChange={setRegSpecs}
                placeholder="Specialization"
                allowCustom
              />
              <MultiSelect
                options={QUALIFICATION_OPTIONS.map(opt => opt.value)}
                selected={regQuals}
                onChange={setRegQuals}
                placeholder="Qualification"
                allowCustom
              />
              <input type="number" placeholder="Experience (Yrs)" min={0} max={60} value={experience} onChange={e => setExperience(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none" />
              <select value={city} onChange={e => setCity(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-500"
              >
                <option value="" disabled>City</option>
                {CITY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0297d6] disabled:opacity-60 text-white py-2 rounded-2xl font-black uppercase tracking-widest text-md lg:text-sm shadow-md"
            >
              {loading ? 'Registering...' : 'Register Now'}
            </button>
          </form>

          <button
            onClick={() => setActivePage('login')}
            className="w-full mt-2 text-[10px] font-black text-slate-700 hover:text-[#0297d6] uppercase tracking-widest"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocSignup;