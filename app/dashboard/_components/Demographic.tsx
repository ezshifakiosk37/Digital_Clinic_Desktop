'use client'
import React, { useState, useMemo } from 'react';
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
  DialogOverlay
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const DemographicPage: React.FC = () => {
  const [form, setForm] = useState<any>({
    country: '',
    province: '',
    city: '',
    phoneNumber: '',
    gender: '',
    countryCode: '+92'
  });

  const [entryId, setEntryId] = useState<string | null>(null);
  const [isFinding, setIsFinding] = useState<{ [key: string]: boolean }>({ phone: false, cnic: false });
  const [isSaving, setIsSaving] = useState(false); // New Loading State
  const [showOther, setShowOther] = useState<{ [key: string]: boolean }>({});
  const [openCode, setOpenCode] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);


  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => form.country ? State.getStatesOfCountry(form.country) : [], [form.country]);
  const cities = useMemo(() => (form.country && form.province) ? City.getCitiesOfState(form.country, form.province) : [], [form.country, form.province]);

  const toggleSelection = (key: string, value: string) => {
    const currentValues = Array.isArray(form[key]) ? form[key] : [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    updateForm(key, newValues);
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
      const data = await apiService.findPatientByPhone(value);
      if (data && data.fields) {
        // Logic: Ensure backend fields map correctly to form keys
        // If backend returns 'stAddress', the input with value={form.stAddress} will now work
        setForm({
          ...data.fields,
          // Provide defaults for UI components that might break on null
          phoneNumber: data.fields.phoneNumber || form.phoneNumber,
          countryCode: data.fields.countryCode || form.countryCode,
          country: data.fields.country || '',
          province: data.fields.province || '',
          city: data.fields.city || '',
          medicalHistory: Array.isArray(data.fields.medicalHistory) ? data.fields.medicalHistory : [],
          medicineHistory: Array.isArray(data.fields.medicineHistory) ? data.fields.medicineHistory : [],
          allergies: Array.isArray(data.fields.allergies) ? data.fields.allergies : [],
        });
        setEntryId(data.entryId);
      } else {
        alert("No record found. Please fill in the details.");
      }
    } catch (error: any) {
      alert(error.message || "Search failed.");
    } finally {
      setIsFinding(prev => ({ ...prev, [searchType]: false }));
    }
  };

  // handleNextStep with this:
  const handleNextStep = async () => {
    const required = ['phoneNumber', 'firstName', 'gender', 'dob', 'languages'];
    const missing = required.filter(field => !form[field]);

    if (missing.length > 0) return alert(`Required: ${missing.join(', ')}`);

    setIsSaving(true);
    try {
      const finalData = { ...form };
      ['medicalHistory', 'medicineHistory', 'allergies'].forEach(key => {
        if (Array.isArray(finalData[key]) && finalData[key].includes("Other")) {
          const customValue = finalData[`${key}Custom`];
          if (customValue) {
            finalData[key] = finalData[key].map((v: string) => v === "Other" ? customValue : v);
          }
        }
      });

      const response = await apiService.saveOrUpdatePatient(finalData, entryId);

      if (response.success) {
        setEntryId(response.entryId);
        // --- NEW LOGIC HERE ---
        setToken(response.token); // Store the token (e.g., "0001")
        setShowTokenDialog(true); // Show the success popup
      }
    } catch (error: any) {
      alert(error.message || "Failed to save details.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ country: '', province: '', city: '', countryCode: '+92' });
    setEntryId(null);
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center w-full">
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
      {/* cards */}
      <Card className="w-full py-2 max-w-3xl -mt-10 shadow-2xl border-none rounded-t-[2.5rem] bg-white overflow-hidden mb-12 mx-2">
        <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 flex items-center gap-3">
          <div className="p-1.5 bg-blue-50 rounded-full">
            <User className="w-5 h-5 text-[#0297d6]" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800">Patient Details</h2>
        </div>

        <form className="py-3 px-4 sm:px-6 md:px-8 space-y-3 bg-white" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number *</Label>
            <div className="flex gap-3 h-9">
              <div className="flex flex-1 overflow-hidden rounded-md border border-slate-100 focus-within:ring-1 focus-within:ring-[#0297d6] items-center">
                <Popover open={openCode} onOpenChange={setOpenCode}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-25 h-full rounded-none bg-slate-100 border-r px-3 text-xs font-bold">
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
                            <CommandItem
                              key={c.isoCode}
                              onSelect={() => {
                                updateForm('countryCode', `+${c.phonecode.replace('+', '')}`)
                                setOpenCode(false)
                              }}
                            >
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

                <Input
                  className="border-none focus-visible:ring-0 h-9 flex-1 rounded-none py-0"
                  placeholder="3331111111"
                  value={form.phoneNumber || ""}
                  onChange={(e) => updateForm('phoneNumber', e.target.value)}
                />
              </div>

              <Button
                type="button"
                disabled={isFinding.phone}
                onClick={() => handleSearch('phone')}
                className="rounded-md bg-[#0297d6] hover:bg-[#0286c2] h-full px-8 font-bold"
              >
                {isFinding.phone ? <Loader2 className="animate-spin w-4 h-4" /> : "Find"}
              </Button>
            </div>
          </div>

          {/* Names Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">First Name *</Label>
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
              <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Gender *</Label>
              <div className="flex gap-4 mt-1">
                {['Male', 'Female', 'Other'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium">
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === g}
                      onChange={() => updateForm('gender', g)}
                      className="accent-[#0297d6] h-4 w-4"
                    /> {g}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* CNIC */}
          <div>
            <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">CNIC</Label>
            <Input className="h-9 py-0" placeholder="42201XXXXXXXX" value={form.cnic || ""} onChange={(e) => updateForm('cnic', e.target.value)} onKeyDown={handleKeyDown} />
          </div>

          {/* DOB + Age */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">DOB *</Label>
              <Input className="h-9 py-0" type="date" value={form.dob || ""} onChange={(e) => updateForm('dob', e.target.value)} onKeyDown={handleKeyDown} />
            </div>
            <div>
              <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase block">Age</Label>
              <Input
                type="number"
                value={form.age || ""}
                onChange={(e) => updateForm('age', e.target.value)}
                className="h-9 py-0 bg-slate-50 border-dashed text-center font-bold text-[#0297d6]"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Label className="text-xs md:text-sm font-bold text-slate-500 uppercase">Primary Language *</Label>
            <select
              className="h-9 w-full border border-slate-200 rounded-md p-2 text-sm bg-white"
              value={form.languages || ""}
              onChange={(e) => updateForm('languages', e.target.value)}
            >
              <option value="">Select Language</option>
              {languageList.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name} {lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''}
                </option>
              ))}
            </select>
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
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Country</Label>
                <select className="h-9 w-full border rounded-md p-2 text-sm bg-white" value={form.country} onChange={(e) => updateForm('country', e.target.value)}>
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Province</Label>
                <select className="h-9 w-full border rounded-md p-2 text-sm bg-white" value={form.province} onChange={(e) => updateForm('province', e.target.value)} disabled={!states.length}>
                  <option value="">Select Province</option>
                  {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-400 uppercase">City</Label>
                <select className="h-9 w-full border rounded-md p-2 text-sm bg-white" value={form.city} onChange={(e) => updateForm('city', e.target.value)} disabled={!cities.length}>
                  <option value="">Select City</option>
                  {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                </select>
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
                  <Input
                    placeholder="Please specify..."
                    className="mt-2 h-9 text-xs border-blue-100 bg-blue-50/30"
                    onChange={(e) => updateForm(`${key}Custom`, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Surgical History */}
          <div className="md:col-span-3 border-t border-slate-100 pt-3">
            <div className="flex flex-row items-center justify-between gap-4 bg-slate-50/50 border border-slate-100 rounded-lg px-4 py-2">
              <span className="text-sm font-semibold text-slate-600">Any surgical History in the past?</span>
              <div className="flex gap-6">
                {['Yes', 'No'].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                    <input
                      type="radio"
                      name="surgicalHistoryToggle"
                      checked={form.surgicalHistory === option}
                      onChange={() => updateForm('surgicalHistory', option)}
                      className="accent-[#0297d6] h-4 w-4"
                    /> {option}
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

            <Button
              disabled={isSaving}
              onClick={handleNextStep}
              className="bg-[#0297d6] hover:bg-[#0286c2] rounded-xl px-10 py-4 text-base md:text-lg font-bold shadow-lg shadow-blue-100 flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-70"
            >
              {isSaving ? (
                <>Saving... <Loader2 className="animate-spin w-5 h-5" /></>
              ) : (
                <>Next Step <ChevronRight className="w-6 h-6" /></>
              )}
            </Button>
          </div>
        </form>
      </Card>
      {/* Success Token Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <DialogHeader>
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl text-center">Registration Successful</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Patient has been checked in.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <p className="text-sm text-slate-500 uppercase font-bold tracking-widest mb-2">Patient Token</p>
            <div className="text-6xl font-black text-[#0297d6] bg-slate-50 py-4 rounded-2xl border-2 border-dashed border-slate-200">
              {token || "----"}
            </div>
          </div>

          <Button
            onClick={() => {
              setShowTokenDialog(false);
              resetForm(); // Clear the form for the next patient
            }}
            className="w-full bg-[#0297d6] h-12 text-lg font-bold"
          >
            Done & New Patient
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DemographicPage;