// consultation/docProfile.tsx
"use client";
import React, { useState } from 'react';
import { Edit2, X, Eye, EyeOff } from 'lucide-react';
import { apiService } from '@/app/_utils/apiService';

// ✅ Import from the correct centralized config file
import {
  TITLE_OPTIONS,
  GENDER_OPTIONS,
  SPECIALIZATION_OPTIONS,
  QUALIFICATION_OPTIONS,
  CITY_OPTIONS,
  DoctorProfile as DoctorProfileType,   // Rename to avoid conflict
} from './doctor_registration';

import { MultiSelect } from './components/MultiSelect';
import { SingleSelect } from './components/SingleSelect';

interface DocProfileProps {
  doctor: DoctorProfileType;
  setDoctor: React.Dispatch<React.SetStateAction<DoctorProfileType>>;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  setActivePage: (page: 'login' | 'signup' | 'dashboard' | 'profile') => void;
}

const DocProfile: React.FC<DocProfileProps> = ({
  doctor,
  setDoctor,
  editMode,
  setEditMode,
  setActivePage,
}) => {
  const fullName = `${doctor.title} ${doctor.firstName} ${doctor.lastName}`;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  React.useEffect(() => {
    apiService.docGetProfile().then((data) => {
      if (data?.doctor) {
        setDoctor((d) => ({ ...d, password: data.doctor.password ?? '' }));
      }
    }).catch(() => { });

  }, []);

  // Reusable text field
  const field = (key: keyof DoctorProfileType, type: string = 'text', placeholder: string = '') => (
    <input
      type={type}
      value={(doctor[key] as string) ?? ''}
      placeholder={placeholder}
      disabled={!editMode}
      onChange={(e) => setDoctor((d) => ({ ...d, [key]: e.target.value }))}
      className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none disabled:opacity-60 disabled:cursor-default w-full"
    />
  );

  // Reusable select field
  const selectField = (key: keyof DoctorProfileType, options: string[], placeholder: string = '') => (
    <select
      value={doctor[key] as string}
      disabled={!editMode}
      onChange={(e) => setDoctor((d) => ({ ...d, [key]: e.target.value }))}
      className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none text-slate-600 disabled:opacity-60 disabled:cursor-default w-full"
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );

  return (
    <div className="p-3 md:p-6">
      <button
        onClick={() => setActivePage('dashboard')}
        className="bg-[#0297d6] text-white py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#0288c2] transition-all mb-4"
      >
        ← Back to Queue
      </button>
      <div className="max-w-3xl mx-auto pb-0">
        <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
          {/* Blue Header */}
          <div className="bg-[#0297d6] px-8 py-3 relative flex flex-col sm:flex-row items-center gap-6">
            <button
              onClick={() => setEditMode(!editMode)}
              className="absolute right-6 top-6 bg-white/20 p-2 rounded-xl text-white hover:bg-white/40 transition-colors"
            >
              {editMode ? <X size={18} /> : <Edit2 size={18} />}
            </button>

            <div className="relative group">
              <img
                src={doctor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ffffff&color=0297d6`}
                className="w-24 h-24 rounded-4xl border-4 border-white/30 shadow-lg object-cover"
                alt="Profile"
              />
              {editMode && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-4xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-[10px] font-black uppercase">
                    {photoUploading ? '...' : 'Change'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setPhotoUploading(true);
                      try {
                        const data = await apiService.uploadDoctorPhoto(f);
                        if (data.url) {
                          setDoctor((d) => ({ ...d, photo: data.url }));
                          // Save to DB immediately
                          const stored = apiService.getDoctor();
                          await apiService.docUpdateProfile(stored.id, { photo: data.url });
                        }
                      } catch (err: any) {
                        setError(err.message || 'Photo upload failed');
                      } finally {
                        setPhotoUploading(false);
                      }
                    }}
                  />
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

          {/* White Content */}
          <div className="px-6 sm:px-10 py-5 bg-white space-y-2.5">
            {/* Personal Info */}
            <div className="grid grid-cols-3 gap-2">
              {selectField('title', TITLE_OPTIONS.map(opt => opt.value), 'Title')}
              {field('firstName', 'text', 'First Name')}
              {field('lastName', 'text', 'Last Name')}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {field('email', 'email', 'Email')}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={doctor.password ?? ''}
                  placeholder="Password"
                  disabled={!editMode}
                  onChange={(e) => setDoctor((d) => ({ ...d, password: e.target.value }))}
                  className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none disabled:opacity-60 disabled:cursor-default w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0297d6] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {field('phone', 'tel', 'Phone')}
              {selectField('gender', GENDER_OPTIONS.map(opt => opt.value), 'Gender')}
            </div>

            <p className="text-[14px] font-black text-[#0297d6] uppercase tracking-widest pt-2">
              Professional Information
            </p>

            {/* Professional Info */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <MultiSelect
                options={SPECIALIZATION_OPTIONS.map(opt => opt.value)}
                selected={doctor.specializations}
                onChange={(v) => setDoctor((d) => ({ ...d, specializations: v }))}
                placeholder="Specialization"
                disabled={!editMode}
                allowCustom
                position="top"
              />

              <MultiSelect
                options={QUALIFICATION_OPTIONS.map(opt => opt.value)}
                selected={doctor.qualifications}
                onChange={(v) => setDoctor((d) => ({ ...d, qualifications: v }))}
                placeholder="Qualification"
                disabled={!editMode}
                allowCustom
                position="top"
              />

              <input
                type="number"
                value={doctor.experience}
                placeholder="Experience (Yrs)"
                disabled={!editMode}
                min={0}
                max={60}
                onChange={(e) => setDoctor((d) => ({ ...d, experience: e.target.value }))}
                className="px-3 py-2.5 bg-slate-50 rounded-2xl font-semibold text-md lg:text-sm border-2 border-transparent focus:border-[#0297d6] outline-none disabled:opacity-60 disabled:cursor-default"
              />

              <SingleSelect
                options={CITY_OPTIONS.map(opt => opt.value)}
                value={doctor.city}
                onChange={(v) => setDoctor((d) => ({ ...d, city: v }))}
                placeholder="Select City"
                disabled={!editMode}
                position="top"
              />
            </div>

            {editMode && (
              <>
                {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold">{error}</div>}
                {success && <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-600 rounded-2xl text-sm font-semibold">Profile updated successfully!</div>}
                <button
                  disabled={loading}
                  onClick={async () => {
                    setError(''); setSuccess(false); setLoading(true);
                    try {
                      const stored = apiService.getDoctor();
                      await apiService.docUpdateProfile(stored.id, {
                        title: doctor.title,
                        firstName: doctor.firstName,
                        lastName: doctor.lastName,
                        email: doctor.email,
                        ...(doctor.password ? { password: doctor.password } : {}),
                        phone: doctor.phone,
                        gender: doctor.gender,
                        specializations: doctor.specializations,
                        qualifications: doctor.qualifications,
                        experience: doctor.experience,
                        city: doctor.city,
                      });
                      setSuccess(true);
                      setEditMode(false);
                    } catch (err: any) {
                      setError(err.message || 'Update failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-[#0297d6] disabled:opacity-60 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocProfile;