'use client'
import React, { useState } from 'react';
import {
  User,
  Search,
  Loader2,
  ChevronRight,
  Info,
  Mail,
  Globe,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import { demographic } from '../../_utils/data/demographicData';
import { FormData, DemographicField } from '../../_utils/types';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/customselect';
import { apiService } from '@/app/_utils/apiService';

const App: React.FC = () => {
  const [form, setForm] = useState<FormData>({});
  // This state tracks if we are editing an existing record
  const [entryId, setEntryId] = useState<string | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getField = (key: string) => demographic.find(f => f.key === key);

  const handleFindUser = async () => {
    const phoneNumber = form["phoneNumber"];

    // Logic Check: Don't waste a network request on invalid data
    if (!phoneNumber || phoneNumber.length < 5) {
      alert("Please enter a valid phone number first.");
      return;
    }

    setIsFinding(true);

    try {
      // 1. Call the centralized service instead of raw fetch
      const data = await apiService.findPatientByPhone(phoneNumber);

      if (data) {
        // 2. Fill the form with the returned data
        // Note: Backend returns { entryId, fields: { ... } }
        setForm(data.fields);

        // 3. Track the ID for the 'Update' logic later
        setEntryId(data.entryId);
        localStorage.setItem("localClinic_entryId", data.entryId);

        alert("Existing record found and loaded.");
      } else {
        // Logic: No data means the phone doesn't exist yet
        setEntryId(null);
        alert("No existing record found. You can create a new one.");
      }
    } catch (error: any) {
      // Logic: Catch real errors (401 Unauthorized, 500 Server Error)
      console.error("Search Error:", error);
      setEntryId(null);
      alert(error.message || "An error occurred while searching.");
    } finally {
      setIsFinding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    try {
      // Logic: Use the service instead of manual fetch.
      // We pass the form data and the current entryId (which is null for new patients).
      const data = await apiService.saveOrUpdatePatient(form, entryId);

      // Logic: apiService already throws an error if !response.ok, 
      // so if we are here, data.success is guaranteed.
      localStorage.setItem("localClinic_entryId", data.entryId);

      alert(entryId
        ? 'Patient record updated successfully!'
        : 'New patient profile created successfully!'
      );

      // Reset state to prepare for the next patient/entry
      setForm({});
      setEntryId(null);

    } catch (error: any) {
      // Brutal Truth: Generic "Failed to save" alerts are useless for debugging.
      // We display the actual error message returned from your Render API.
      console.error("Submission Error:", error);
      alert(`Submission Failed: ${error.message || "Unknown Error"}`);
    } finally {
      setIsSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 py-12 pr-6 flex flex-col items-center ">

      <div className="w-full max-w-4xl relative z-10">
        {/* Page Header */}
        <header className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-xl shadow-blue-500/10 border border-slate-100 mb-6">
            <User className="w-10 h-10 text-[#0297d6]" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Demographic Information
          </h1>
          <p className="text-slate-500 mx-auto font-medium">
            Please provide your details below to finalize your registration profile.
          </p>
        </header>

        <Card className='shadow-xl shadow-black/15 border-none'>
          <div className="p-8 sm:p-14">
            <form onSubmit={handleSubmit} className="space-y-10">

              {/* Phone Number with Find Action */}
              <div className="space-y-3">
                <Label required className='text-sm font-semibold text-primary tracking-wider'>{getField('phoneNumber')?.question.toUpperCase()}</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      required
                      type="tel"
                      placeholder={getField('phoneNumber')?.placeHolder}
                      value={form.phoneNumber || ""}
                      maxLength={11}
                      onChange={(e) => updateForm('phoneNumber', e.target.value)}
                      className="pl-12 py-6"
                    />
                    <PhoneCall className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleFindUser}
                    disabled={isFinding || !form.phoneNumber}
                    className='py-6 '
                  >
                    {isFinding ? <Loader2 color='white' className="w-5 h-5 animate-spin" /> : <Search color='white' className="w-5 h-5" />}
                    <span className="hidden sm:inline text-white">Find</span>
                  </Button>
                </div>
              </div>

              {/* Name and Age - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-3">
                  <Label required className='text-sm font-semibold text-primary tracking-wider'>{getField('firstName')?.question.toUpperCase()}</Label>
                  <Input
                    required
                    placeholder={getField('firstName')?.placeHolder}
                    value={form.firstName || ""}
                    type='text'
                    onChange={(e) => updateForm('firstName', e.target.value)}
                  />
                </div>
                <div className="md:col-span-4 space-y-3">
                  <Label required className='text-sm font-semibold text-primary tracking-wider'>{getField('lastName')?.question.toUpperCase()}</Label>
                  <Input
                    required
                    placeholder={getField('lastName')?.placeHolder}
                    value={form.lastName || ""}
                    type='text'
                    onChange={(e) => updateForm('lastName', e.target.value)}
                  />
                </div>
                <div className="md:col-span-4 space-y-3">
                  <Label required className='text-sm font-semibold text-primary tracking-wider'>{getField('age')?.question.toUpperCase()}</Label>
                  <Input
                    required
                    type="number"
                    placeholder={getField('age')?.placeHolder}
                    value={form.age || ""}
                    onChange={(e) => updateForm('age', e.target.value)}
                  />
                </div>
              </div>

              {/* Father / Husband Name */}
              <div className="space-y-3">
                <Label required className='text-sm font-semibold text-primary tracking-wider'>{getField('father_husband')?.question.toUpperCase()}</Label>
                <Input
                  required
                  placeholder={getField('father_husband')?.placeHolder}
                  value={form.father_husband || ""}
                  onChange={(e) => updateForm('father_husband', e.target.value)}
                />
              </div>

              {/* Gender - Radio Buttons */}
              <div className="space-y-3">
                <Label required className='text-sm font-semibold text-primary tracking-wider'>{getField('gender')?.question.toUpperCase()}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {getField('gender')?.options?.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateForm('gender', opt)}
                      className={`
                        flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-all duration-300
                        ${form.gender === opt
                          ? 'border-[#0297d6] bg-blue-50/50 ring-2 ring-[#0297d6]/10 shadow-sm'
                          : 'bg-white border border-black/20'}
                      `}
                    >
                      <span className={`font-semibold text-sm ${form.gender === opt ? 'text-[#0297d6]' : 'text-slate-600'}`}>
                        {opt}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.gender === opt ? 'border-[#0297d6] bg-[#0297d6]' : 'border-slate-200'}`}>
                        {form.gender === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualification and Profession - Side by Side Dropdowns */}

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-50">
                <Button
                  type="submit"
                  disabled={isSubmitted}
                  className="w-full h-16 text-lg"
                >
                  {isSubmitted ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Save and Continue
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Card Meta Footer */}

        </Card>

        {/* Global Footer */}

      </div>
    </div>
  );
};

export default App;
