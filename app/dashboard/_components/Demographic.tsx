'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, ChevronRight, RotateCcw, User, MapPin, Activity } from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { demographic } from '../../_utils/data/demographicData';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils"
import { apiService } from '@/app/_utils/apiService';
import ISO6391 from 'iso-639-1';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PatientForm } from '@/app/_utils/types';

const DemographicPage: React.FC = () => {

  const [form, setForm] = useState<any>({
    country: '',
    province: '',
    city: '',
    phoneNumber: '',
    gender: '',
    countryCode: '+92',
    mrNumber: '',
  });

  const defaultPatient: Partial<PatientForm> = {
    firstName: '.',
    lastName: '',
    father_husband: '',
    email: '',
    gender: 'Male',
    dob: '1990-01-01',
    age: '0',
    languages: '',
    country: 'PK',
    province: 'PB',
    city: 'Karachi',
    stAddress: '',
    medicalHistory: [],
    medicineHistory: [],
    allergies: [],
    surgicalHistory: 'No',
  };

  const [entryId, setEntryId] = useState<string | null>(null);
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);
  const [isFinding, setIsFinding] = useState<{ [key: string]: boolean }>({ phone: false, cnic: false });
  const [isSaving, setIsSaving] = useState(false);
  const [showOther, setShowOther] = useState<{ [key: string]: boolean }>({});
  const [openCode, setOpenCode] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isMRToggled, setIsMRToggled] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => form.country ? State.getStatesOfCountry(form.country) : [], [form.country]);
  const cities = useMemo(() => (form.country && form.province) ? City.getCitiesOfState(form.country, form.province) : [], [form.country, form.province]);

  // ──────────────────────────────────────────────────────────────────
  // MR Mode: fill static defaults when typing, clear when empty
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMRToggled) {
      if (form.mrNumber?.trim()) {
        // Fill with static defaults (no DB call)
        setForm((prev: any) => ({
          ...prev,
          ...defaultPatient,
          mrNumber: prev.mrNumber,   // keep the typed MR number
          phoneNumber: '',
          cnic: '',
        }));
      } else {
        // Clear all auto‑filled fields when MR input is empty
        setForm((prev: any) => ({
          ...prev,
          firstName: '',
          lastName: '',
          father_husband: '',
          email: '',
          gender: '',
          dob: '',
          age: '',
          languages: '',
          country: '',
          province: '',
          city: '',
          stAddress: '',
          medicalHistory: [],
          medicineHistory: [],
          allergies: [],
          surgicalHistory: '',
        }));
      }
    }
  }, [form.mrNumber, isMRToggled]);

  // ──────────────────────────────────────────────────────────────────
  // Helper functions (unchanged)
  // ──────────────────────────────────────────────────────────────────
  const toggleSelection = (key: string, value: string) => {
    const currentValues = Array.isArray(form[key]) ? form[key] : [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    updateForm(key, newValues);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const updateForm = (key: string, value: any) => {
    setForm((prev: any) => {
      const updated = { ...prev, [key]: value };
      if (key === 'country') { updated.province = ''; updated.city = ''; }
      if (key === 'province') { updated.city = ''; }
      if (key === 'dob') {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        updated.age = age.toString();
      }
      else if (key === 'age') {
        const ageNum = parseInt(value);
        if (!isNaN(ageNum)) {
          const today = new Date();
          const birthYear = today.getFullYear() - ageNum;
          updated.dob = `${birthYear}-01-01`;
        }
      }
      return updated;
    });

    if (["medicalHistory", "medicineHistory", "allergies"].includes(key)) {
      setShowOther(prev => ({ ...prev, [key]: value === "Other" }));
    }
  };

  const handleSearch = async (searchType: 'phone' | 'cnic') => {
    const value = searchType === 'phone' ? form.phoneNumber : form.cnic;
    if (!value) return alert(`Please enter ${searchType} to search.`);

    setIsFinding(prev => ({ ...prev, [searchType]: true }));
    try {
      const data = searchType === 'cnic'
        ? await apiService.findPatientByCnic(value)
        : await apiService.findPatientByPhone(value);
      if (data && data.fields) {
        const clean = (val: any) => (!val || val === "null") ? "" : val;
        setForm({
          ...data.fields,
          phoneNumber: clean(data.fields.phoneNumber) || form.phoneNumber,
          countryCode: clean(data.fields.countryCode) || form.countryCode,
          firstName: clean(data.fields.firstName),
          lastName: clean(data.fields.lastName),
          father_husband: clean(data.fields.father_husband),
          email: clean(data.fields.email),
          cnic: clean(data.fields.cnic),
          dob: clean(data.fields.dob),
          age: clean(data.fields.age),
          languages: clean(data.fields.languages),
          stAddress: clean(data.fields.stAddress),
          country: clean(data.fields.country),
          province: clean(data.fields.province),
          city: clean(data.fields.city),
          medicalHistory: Array.isArray(data.fields.medicalHistory) ? data.fields.medicalHistory : [],
          medicineHistory: Array.isArray(data.fields.medicineHistory) ? data.fields.medicineHistory : [],
          allergies: Array.isArray(data.fields.allergies) ? data.fields.allergies : [],
        });
        setEntryId(data.entryId);
        setExistingPatientId(data.entryId);
      } else {
        showNotification("No record found. Please fill in the details.");
        setExistingPatientId(null);
      }
    } catch (error: any) {
      alert(error.message || "Search failed.");
    } finally {
      setIsFinding(prev => ({ ...prev, [searchType]: false }));
    }
  };

  const handleToggle = () => {
    setIsMRToggled(!isMRToggled);
    setExistingPatientId(null);
    setEntryId(null);
    setForm({
      country: '',
      province: '',
      city: '',
      phoneNumber: '',
      gender: '',
      countryCode: '+92',
      mrNumber: '',
    });
  };

  const handleNextStep = async () => {
    let required: (keyof PatientForm)[];
    if (isMRToggled) {
      required = ['mrNumber', 'firstName', 'gender', 'dob', 'age', 'country', 'city', 'province'];
    } else {
      required = ['phoneNumber', 'firstName', 'gender', 'dob', 'age', 'country', 'city', 'province'];
    }

    const missing = required.filter(field => {
      const value = form[field];
      if (field === 'mrNumber') return !value?.toString().trim();
      if (field === 'phoneNumber') return !value?.toString().trim();
      return !value;
    });

    if (missing.length > 0) {
      showNotification("Please fill all required fields marked with *.");
      return;
    }

    setIsSaving(true);
    try {
      const finalData: any = { ...form };

      if (isMRToggled) {
        // MR mode: keep mrNumber, clear phone/cnic
        finalData.phoneNumber = '';
        finalData.cnic = '';
        // do NOT delete mrNumber
      } else {
        // Normal mode: do not send mrNumber
        delete finalData.mrNumber;
      }

      // Handle "Other" in medical history fields
      ['medicalHistory', 'medicineHistory', 'allergies'].forEach(key => {
        if (Array.isArray(finalData[key]) && finalData[key].includes("Other")) {
          const customValue = finalData[`${key}Custom`];
          if (customValue) {
            finalData[key] = finalData[key].map((v: string) => v === "Other" ? customValue : v);
          }
        }
      });

      // For MR mode, do NOT pass any patientId – backend will find by mrNumber.
      // For normal mode, use the ID from search.
      let patientId = null;
      if (!isMRToggled) {
        patientId = existingPatientId || (entryId && entryId !== 'null' ? entryId : null);
      }

      const response = await apiService.saveOrUpdatePatient(finalData, patientId);

      if (response.success) {
        setEntryId(response.entryId);
        setExistingPatientId(response.entryId);
        setToken(response.token);
        setShowTokenDialog(true);
      }
    } catch (error: any) {
      showNotification(error.message || "Failed to save details.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      country: '',
      province: '',
      city: '',
      phoneNumber: '',
      gender: '',
      countryCode: '+92',
      mrNumber: '',
    });
    setEntryId(null);
    setExistingPatientId(null);
    setShowOther({});
  };

  const getField = (key: string) => demographic.find(f => f.key === key);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('input, select'));
      const index = inputs.indexOf(e.target as any);
      if (index > -1 && inputs[index + 1]) {
        (inputs[index + 1] as HTMLElement).focus();
      }
    }
  };

  const languageList = useMemo(() => {
    return ISO6391.getAllCodes().map(code => ({
      code,
      name: ISO6391.getName(code),
      nativeName: ISO6391.getNativeName(code)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center w-full">
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#d602a1] text-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold animate-fade-in flex items-center gap-2">
          <span>ℹ️</span> {notification}
        </div>
      )}
      <div className="w-full bg-[#0297d6] pt-4 pb-12 px-4 text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-3 min-w-0">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">EZShifa</h1>
            <span className="opacity-50 text-sm shrink-0">|</span>
            <p className="opacity-80 text-md truncate">Site: EZShifa • Digital Health Clinic</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl px-4 md:px-4 flex flex-col items-center">
        <Card className="w-full py-2 -mt-10 shadow-2xl border-none rounded-t-[2.5rem] bg-white overflow-hidden mb-8 mx-6 gap-1 md:mx-20">
          {/* Header with toggle */}
          <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 flex items-center justify-between gap-3">
            <div className='flex items-center gap-3'>
              <div className="p-1.5 bg-blue-50 rounded-full">
                <User className="w-5 h-5 text-[#0297d6]" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Patient Details</h2>
            </div>

            <div className='flex items-center gap-3'>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isMRToggled ? 'bg-[#0297d6]' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={isMRToggled}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMRToggled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-slate-600 font-medium">
                {isMRToggled ? 'MR Mode ON' : 'Switch to MR'}
              </span>
            </div>
          </div>

          <div className="mx-6 text-center px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-[12px] text-slate-500">
            {!isMRToggled ? "Enter Phone Number or CNIC and click Find to retrieve existing patient data." : "Scan the MR number to skip the data"}
          </div>

          <form className="py-3 px-4 sm:px-6 md:px-8 space-y-3 bg-white" onSubmit={(e) => e.preventDefault()}>
            {!isMRToggled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Phone Number */}
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">Phone Number <span className='text-red-500'>*</span></Label>
                  <div className="flex h-9 overflow-hidden rounded-md border border-slate-100 focus-within:ring-1 focus-within:ring-[#0297d6] items-center">
                    <Popover open={openCode} onOpenChange={setOpenCode}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="w-25 h-full rounded-none bg-slate-100 border-r px-3 text-xs md:text-sm font-bold">
                          {form.countryCode || "+92"}
                          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-50 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search code..." className="h-9 py-0" />
                          <CommandList>
                            <CommandEmpty>No code found.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-y-auto">
                              {countries.map((c) => (
                                <CommandItem key={c.isoCode} onSelect={() => { updateForm('countryCode', `+${c.phonecode.replace('+', '')}`); setOpenCode(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", form.countryCode === `+${c.phonecode.replace('+', '')}` ? "opacity-100" : "opacity-0")} />
                                  <span className="flex-1">{c.name}</span>
                                  <span className="text-slate-400">+{c.phonecode.replace('+', '')}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input className="border-none focus-visible:ring-0 h-9 flex-1 rounded-none py-0" placeholder="3331111111" value={form.phoneNumber || ""} onChange={(e) => updateForm('phoneNumber', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">CNIC</Label>
                  <div className="flex gap-2 h-9">
                    <Input className="h-9 py-0 flex-1" placeholder="42201XXXXXXXX" value={form.cnic || ""} onChange={(e) => updateForm('cnic', e.target.value)} onKeyDown={handleKeyDown} />
                    <Button type="button" disabled={isFinding.phone || isFinding.cnic} onClick={() => { if (form.phoneNumber) handleSearch('phone'); else if (form.cnic) handleSearch('cnic'); else alert('Please enter a Phone Number or CNIC to search.'); }} className="rounded-md bg-[#0297d6] hover:bg-[#0286c2] h-full px-6 font-bold shrink-0">
                      {(isFinding.phone || isFinding.cnic) ? <Loader2 className="animate-spin w-4 h-4" /> : "Find"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">MR Number <span className='text-red-500'>*</span></Label>
                <div className="flex h-16 overflow-hidden rounded-md border border-slate-100 focus-within:ring-1 focus-within:ring-[#0297d6] items-center">
                  <Input type='number' className="border-none text-center placeholder:text-center focus-visible:ring-0 h-full flex-1 rounded-none py-0" placeholder="Please Enter MR Number" value={form.mrNumber || ""} onChange={(e) => updateForm('mrNumber', e.target.value)} />
                </div>
              </div>
            )}

            {/* Names Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">First Name <span className='text-red-500'>*</span></Label>
                <Input className="h-9 py-0" value={form.firstName || ""} onChange={(e) => updateForm('firstName', e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Last Name</Label>
                <Input className="h-9 py-0" value={form.lastName || ""} onChange={(e) => updateForm('lastName', e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Father/Husband Name</Label>
                <Input className="h-9 py-0" value={form.father_husband || ""} onChange={(e) => updateForm('father_husband', e.target.value)} onKeyDown={handleKeyDown} />
              </div>
            </div>

            {/* Email & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Email Address</Label>
                <Input className="h-9 py-0" type="email" value={form.email || ""} onChange={(e) => updateForm('email', e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Gender <span className='text-red-500'>*</span></Label>
                <div className="flex gap-4 mt-1">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium">
                      <input type="radio" name="gender" checked={form.gender === g} onChange={() => updateForm('gender', g)} className="accent-[#0297d6] h-4 w-4" /> {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* DOB + Age */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">DOB <span className='text-red-500'>*</span></Label>
                <Input className="h-9 py-0" type="date" value={form.dob || ""} onChange={(e) => updateForm('dob', e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase block">Age <span className='text-red-500'>*</span></Label>
                <Input type="number" value={form.age || ""} onChange={(e) => updateForm('age', e.target.value)} className="h-9 py-0 bg-slate-50 border-dashed text-center font-bold text-[#0297d6]" />
              </div>
            </div>

            {/* Languages */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Primary Language</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 text-left bg-slate-50/50">
                    <span className={form.languages ? "text-slate-800" : "text-slate-400"}>{form.languages || "Select Language..."}</span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search language..." />
                    <CommandList>
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {languageList.map((lang) => (
                          <CommandItem key={lang.code} onSelect={() => updateForm('languages', lang.name)}>
                            <Check className={cn("mr-2 h-4 w-4", form.languages === lang.name ? "opacity-100" : "opacity-0")} />
                            {lang.name} {lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location Section */}
            <div className="border-t border-slate-100 space-y-3 pt-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 uppercase">Address & Location</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Street Address</Label>
                  <Input className="h-9 py-0" placeholder="House #, Street..." value={form.stAddress || ""} onChange={(e) => updateForm('stAddress', e.target.value)} onKeyDown={handleKeyDown} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Country <span className='text-red-500'>*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-left bg-slate-50/50">
                        <span className={form.country ? "text-slate-800" : "text-slate-400"}>{countries.find(c => c.isoCode === form.country)?.name || "Select Country..."}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {countries.map((c) => (
                              <CommandItem key={c.isoCode} onSelect={() => updateForm('country', c.isoCode)}>
                                <Check className={cn("mr-2 h-4 w-4", form.country === c.isoCode ? "opacity-100" : "opacity-0")} />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Province <span className='text-red-500'>*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-left bg-slate-50/50" disabled={!states.length}>
                        <span className={form.province ? "text-slate-800" : "text-slate-400"}>{states.find(s => s.isoCode === form.province)?.name || "Select Province..."}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search province..." />
                        <CommandList>
                          <CommandEmpty>No province found.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {states.map((s) => (
                              <CommandItem key={s.isoCode} onSelect={() => updateForm('province', s.isoCode)}>
                                <Check className={cn("mr-2 h-4 w-4", form.province === s.isoCode ? "opacity-100" : "opacity-0")} />
                                {s.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">City <span className='text-red-500'>*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-left bg-slate-50/50" disabled={!cities.length}>
                        <span className={form.city ? "text-slate-800" : "text-slate-400"}>{form.city || "Select City..."}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search city..." />
                        <CommandList>
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {cities.map((city) => (
                              <CommandItem key={city.name} onSelect={() => updateForm('city', city.name)}>
                                <Check className={cn("mr-2 h-4 w-4", form.city === city.name ? "opacity-100" : "opacity-0")} />
                                {city.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
              {['medicalHistory', 'medicineHistory', 'allergies'].map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{getField(key)?.question}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-auto min-h-9 py-0 text-left bg-slate-50/50">
                        <div className="flex flex-wrap gap-1 py-1">
                          {form[key]?.length > 0 ? (
                            form[key].map((val: string) => (
                              <span key={val} className="bg-[#0297d6]/10 text-[#0297d6] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0297d6]/20">{val}</span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm">Select multiple...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-62.5 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandList>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {getField(key)?.options?.map((option) => (
                              <CommandItem key={option} onSelect={() => toggleSelection(key, option)} className="flex items-center gap-2">
                                <div className={cn("flex h-4 w-4 items-center justify-center rounded border border-primary", form[key]?.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                                  {form[key]?.includes(option) && <Check className="h-3 w-3" />}
                                </div>
                                <span>{option}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form[key]?.includes("Other") && (
                    <Input placeholder="Please specify..." className="mt-2 h-9 text-xs border-blue-100 bg-blue-50/30" onChange={(e) => updateForm(`${key}Custom`, e.target.value)} />
                  )}
                </div>
              ))}
            </div>

            {/* Surgical History */}
            <div className="md:col-span-3 border-t border-slate-100 pt-3">
              <div className="flex flex-row items-center justify-between gap-4 bg-slate-50/50 border border-slate-100 rounded-lg px-4 py-2">
                <span className="text-sm font-semibold text-slate-600">Any surgical History in the past? <span className='text-red-500'>*</span></span>
                <div className="flex gap-6">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                      <input type="radio" name="surgicalHistoryToggle" checked={form.surgicalHistory === option} onChange={() => updateForm('surgicalHistory', option)} className="accent-[#0297d6] h-4 w-4" /> {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={resetForm} className="rounded-full w-12 h-12 p-0 hover:bg-red-50 hover:text-red-500">
                <RotateCcw className="w-6 h-6" />
              </Button>
              <Button disabled={isSaving} onClick={handleNextStep} className="bg-[#0297d6] hover:bg-[#0286c2] rounded-xl px-10 py-4 text-base md:text-lg font-bold shadow-lg shadow-blue-100 flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-70">
                {isSaving ? <>Saving... <Loader2 className="animate-spin w-5 h-5" /></> : <>Next Step <ChevronRight className="w-6 h-6" /></>}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <DialogHeader>
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl text-center">Registration Successful</DialogTitle>
            <DialogDescription className="text-center text-lg">Patient has been checked in.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-2">Patient Token</p>
            <div className="text-6xl font-black text-[#0297d6] bg-slate-50 py-4 rounded-2xl border-2 border-dashed border-slate-200">
              {token || "----"}
            </div>
          </div>
          <Button onClick={() => { setShowTokenDialog(false); resetForm(); }} className="w-full bg-[#0297d6] h-12 text-lg font-bold">
            Done & New Patient
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemographicPage;