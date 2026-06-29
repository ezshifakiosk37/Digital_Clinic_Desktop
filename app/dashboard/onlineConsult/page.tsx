'use client'
import { Activity, RefreshCw, Search, X, Phone, Hash, User, ChevronDown, ChevronUp } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { apiService } from '@/app/_utils/apiService'
import { VideoConsultModel } from '../vitals/_components/VideoConsultModel'
import { PatientResult, Doctor, QueueItem } from '@/app/_utils/types'
import Navbar from '../_components/Navbar'
import { COMMON_SYMPTOMS } from '../vitals/vitals'

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseSymptoms = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch { }
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

type SearchMode = 'token' | 'name' | 'phone'
// ── Symptom Searchable Dropdown ───────────────────────────────────────────────
const SymptomDropdown = ({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (s: string[]) => void
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = COMMON_SYMPTOMS.filter(s =>
    s.toLowerCase().includes(query.toLowerCase()) && !selected.includes(s)
  )

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 w-full border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer hover:border-[#0297d6] focus-within:border-[#0297d6] focus-within:ring-2 focus-within:ring-[#0297d6]/10 transition-all bg-white"
      >
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search symptoms..."
          className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
        />
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No symptoms found</div>
            ) : (
              filtered.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => { onChange([...selected, symptom]); setQuery('') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-[#0297d6]/5 hover:text-[#0297d6] transition-colors flex items-center justify-between group"
                >
                  <span>{symptom}</span>
                  <span className="text-[10px] font-bold text-[#0297d6] opacity-0 group-hover:opacity-100 transition-opacity">+ Add</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Component ─────────────────────────────────────────────────────────────────
const OnlineConsultPage = () => {

  // ── State ─────────────────────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState<SearchMode>('token')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientResult[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedSymptoms, setExpandedSymptoms] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [search, setSearch] = useState("")
  const [expandedToken, setExpandedToken] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  // Doctor picker: which patient triggered it
  const [pickerPatient, setPickerPatient] = useState<PatientResult | null>(null)

  // Video consult
  const [videoVitalsId, setVideoVitalsId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loadQueue = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await apiService.getTodayQueue()
      const all: QueueItem[] = res.patients ?? []
      setQueue(all.filter(p => p.patientType === 'Online Consultation'))
    } catch (err) {
      console.error("Failed to load queue", err)
    } finally {
      if (showSpinner) setRefreshing(false)
    }
  }

  useEffect(() => { loadQueue() }, [])

  const filtered = queue.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = `${p.firstName} ${p.lastName}`.toLowerCase()
    const rev = `${p.lastName} ${p.firstName}`.toLowerCase()
    return name.includes(q) || rev.includes(q) || String(p.token).includes(q)
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Functions ──────────────────────────────────────────────────────────────
  const loadDoctors = async () => {
    setLoadingDoctors(true)
    try {
      const data = await apiService.getAllDoctors()
      setDoctors(data.doctors || [])
    } catch (err) {
      console.error('Failed to load doctors', err)
    } finally {
      setLoadingDoctors(false)
    }
  }


  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setHasSearched(true)
    try {
      const res = await apiService.getTodayQueue()
      const allPatients: PatientResult[] = res.patients ?? []
      const lower = q.toLowerCase()
      const filtered = allPatients.filter(p => {
        if (searchMode === 'token') return String(p.token).toLowerCase().includes(lower)
        if (searchMode === 'phone') return String(p.phoneNumber || '').toLowerCase().includes(lower)
        const full = `${p.firstName} ${p.lastName}`.toLowerCase()
        const rev = `${p.lastName} ${p.firstName}`.toLowerCase()
        return full.includes(lower) || rev.includes(lower)
      })
      setSearchResults(filtered)
    } catch (err) {
      console.error('Search failed', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    inputRef.current?.focus()
  }

  const onlineDocotrs = doctors.filter(d => d.doctorStatus === 'online')

  const handleConsultClick = (patient: PatientResult) => {
    if (!patient.vitalsId) return
    const symptoms = parseSymptoms(patient.symptoms)
    const hasSymptoms = symptoms.length > 0 && !symptoms.every(s => s.toLowerCase() === 'unknown')
    if (!hasSymptoms) {
      setSymptomsPatient(patient)
      setPendingSymptoms([])
      return
    }
    setPickerPatient(patient)
  }

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [symptomsPatient, setSymptomsPatient] = useState<PatientResult | null>(null)
  const [pendingSymptoms, setPendingSymptoms] = useState<string[]>([])
  const [savingSymptoms, setSavingSymptoms] = useState(false)

  const handleDoctorPick = (doctor: Doctor) => {
    if (!pickerPatient?.vitalsId) return
    setSelectedDoctorId(doctor.id)
    setVideoVitalsId(pickerPatient.vitalsId)
    setPickerPatient(null)
  }

  const searchModeMeta: Record<SearchMode, { icon: React.ReactNode; placeholder: string }> = {
    name: { icon: <User size={14} />, placeholder: 'e.g. Saad Kamal or just Saad' },
    token: { icon: <Hash size={14} />, placeholder: 'e.g. 12' },
    phone: { icon: <Phone size={14} />, placeholder: 'e.g. 03001234567' },
  }

  useEffect(() => { loadDoctors() }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <Navbar variant="onlineConsult" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Patient Search Card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-800">Find Patient for Today</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search among today's patients whose vitals have been recorded</p>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Mode tabs */}
            <div className="flex gap-2">
              {(['name', 'token', 'phone'] as SearchMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setSearchMode(mode); setSearchQuery(''); setSearchResults([]); setHasSearched(false) }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${searchMode === mode
                    ? 'bg-[#0297d6] text-white border-[#0297d6]'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#0297d6]/40'
                    }`}
                >
                  {searchModeMeta[mode].icon}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchModeMeta[searchMode].placeholder}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0297d6] focus:ring-2 focus:ring-[#0297d6]/10"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-5 py-2.5 bg-[#0297d6] hover:bg-[#0286c2] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                {searching
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching</>
                  : <><Search size={14} />Search</>}
              </button>
            </div>

            {/* Results table */}
            {hasSearched && (
              <div className="mt-2">
                {searchResults.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">
                    No patients found for today matching{' '}
                    <span className="font-semibold text-slate-600">"{searchQuery}"</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-400 font-semibold mb-3">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-4 py-3">Token</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Phone</th>
                            <th className="px-4 py-3">Symptoms</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {searchResults.map(p => {
                            const symptoms = parseSymptoms(p.symptoms)
                            const isExpanded = expandedSymptoms === p.id
                            return (
                              <tr key={`${p.id}-${p.token}`} className="hover:bg-slate-50/60 transition-colors">

                                {/* Token */}
                                <td className="px-4 py-4">
                                  <span className="bg-[#0297d6]/10 text-[#0297d6] font-black text-xs px-2.5 py-1 rounded-lg">
                                    #{p.token}
                                  </span>
                                </td>

                                {/* Name */}
                                <td className="px-4 py-4">
                                  <p className="font-bold text-slate-800 text-sm">{p.firstName} {p.lastName}</p>
                                </td>

                                {/* Phone */}
                                <td className="px-4 py-4 hidden sm:table-cell">
                                  <p className="text-sm text-slate-500">{p.phoneNumber || '—'}</p>
                                </td>

                                {/* Symptoms */}
                                <td className="px-4 py-4 max-w-xs">
                                  {symptoms.length === 0 ? (
                                    <span className="text-slate-300 text-sm">—</span>
                                  ) : (
                                    <div>
                                      <div className="flex flex-wrap gap-1">
                                        {(isExpanded ? symptoms : symptoms.slice(0, 2)).map((s, i) => (
                                          <span key={i} className="text-[10px] font-semibold bg-[#0297d6]/10 text-[#0297d6] px-2 py-0.5 rounded-full">
                                            {s.startsWith('Other:') ? `Other: ${s.slice(6)}` : s}
                                          </span>
                                        ))}
                                        {symptoms.length > 2 && (
                                          <button
                                            onClick={() => setExpandedSymptoms(isExpanded ? null : p.id)}
                                            className="text-[10px] font-bold text-slate-400 hover:text-[#0297d6] flex items-center gap-0.5"
                                          >
                                            {isExpanded
                                              ? <><ChevronUp size={11} />less</>
                                              : <><ChevronDown size={11} />+{symptoms.length - 2} more</>}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Action */}
                                <td className="px-4 py-4 text-right">
                                  <button
                                    onClick={() => handleConsultClick(p)}
                                    disabled={!p.vitalsId}
                                    title={!p.vitalsId ? 'Vitals not recorded' : 'Select a doctor to consult'}
                                    className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors ${p.vitalsId
                                      ? 'bg-[#0297d6] hover:bg-[#0286c2] text-white'
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      }`}
                                  >
                                    💻 Consult
                                  </button>
                                </td>

                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Available Doctors Card ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-800">Online Doctors</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loadingDoctors ? 'Loading...' : `${onlineDocotrs.length} doctor${onlineDocotrs.length !== 1 ? 's' : ''} currently online`}
              </p>
            </div>
            <button
              onClick={loadDoctors}
              disabled={loadingDoctors}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#0297d6] hover:text-[#0297d6] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loadingDoctors ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="p-6">
            {loadingDoctors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                    <div className="h-32 bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : onlineDocotrs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No doctors are currently online
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {onlineDocotrs.map(doc => (
                  <DoctorCard key={doc.id} doctor={doc} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Symptoms Required Dialog ───────────────────────────────────────── */}
      {symptomsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">No Symptoms Recorded</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Please select symptoms for{' '}
                  <span className="font-semibold text-slate-600">
                    {symptomsPatient.firstName} {symptomsPatient.lastName}
                  </span>
                  {' '}before starting the consultation.
                </p>
              </div>
              <button
                onClick={() => setSymptomsPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Symptoms</p>

              {/* Selected tags */}
              {pendingSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pendingSymptoms.map(s => (
                    <span key={s} className="flex items-center gap-1 text-[10px] font-bold bg-[#0297d6]/10 text-[#0297d6] px-2 py-1 rounded-full">
                      {s}
                      <button
                        onClick={() => setPendingSymptoms(prev => prev.filter(x => x !== s))}
                        className="hover:text-red-400 ml-0.5 leading-none"
                      >×</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Searchable dropdown */}
              <SymptomDropdown selected={pendingSymptoms} onChange={setPendingSymptoms} />
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setSymptomsPatient(null)}
                className="text-sm font-bold text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={pendingSymptoms.length === 0 || savingSymptoms}
                onClick={async () => {
                  if (!symptomsPatient?.vitalsId || pendingSymptoms.length === 0) return
                  setSavingSymptoms(true)
                  try {
                    await apiService.updateSymptoms(symptomsPatient.vitalsId, pendingSymptoms)
                    // Update local search results so the symptoms show
                    setSearchResults(prev => prev.map(p =>
                      p.id === symptomsPatient.id
                        ? { ...p, symptoms: pendingSymptoms.join(',') }
                        : p
                    ))
                    setPickerPatient({ ...symptomsPatient, symptoms: pendingSymptoms.join(',') })
                    setSymptomsPatient(null)
                  } catch (err) {
                    console.error('Failed to save symptoms', err)
                  } finally {
                    setSavingSymptoms(false)
                  }
                }}
                className="px-6 py-2.5 bg-[#0297d6] hover:bg-[#0286c2] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                {savingSymptoms
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                  : 'Save & Continue →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Doctor Picker Modal ─────────────────────────────────────────────── */}
      {pickerPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Select a Doctor</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consulting for{' '}
                  <span className="font-semibold text-slate-600">
                    {pickerPatient.firstName} {pickerPatient.lastName}
                  </span>
                  {' '}— Token <span className="text-[#0297d6] font-black">#{pickerPatient.token}</span>
                </p>
              </div>
              <button
                onClick={() => setPickerPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors mt-0.5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Doctor grid inside modal */}
            <div className="p-6">
              {onlineDocotrs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No doctors are currently online
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onlineDocotrs.map(doc => {
                    const initials = `${doc.firstName[0]}${doc.lastName[0]}`.toUpperCase()
                    const specs = Array.isArray(doc.specializations)
                      ? doc.specializations.slice(0, 2).join(' • ')
                      : typeof doc.specializations === 'string'
                        ? doc.specializations : ''
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleDoctorPick(doc)}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#0297d6]/40 hover:bg-[#0297d6]/5 hover:shadow-sm transition-all text-left group"
                      >
                        {/* Photo / initial */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0297d6]/10 flex items-center justify-center shrink-0">
                          {doc.photo
                            ? <img src={doc.photo} alt={doc.firstName} className="w-full h-full object-cover" />
                            : <span className="text-lg font-black text-[#0297d6]/50">{initials}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">
                            {doc.title} {doc.firstName} {doc.lastName}
                          </p>
                          {specs && <p className="text-[11px] text-[#0297d6] font-semibold mt-0.5 truncate">{specs}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{doc.experience} yr{doc.experience !== 1 ? 's' : ''} experience</p>
                        </div>
                        <span className="text-xs font-bold text-[#0297d6] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Select →
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 `z-9999` bg-red-600 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <span>⚠</span> {toast}
        </div>
      )}

      {/* Video consult modal */}
      <VideoConsultModel
        isOpen={!!videoVitalsId}
        onClose={() => { setVideoVitalsId(null); setSelectedDoctorId(null); }}
        vitalsId={videoVitalsId}
        patientId={pickerPatient?.id ?? null}
        patientToken={pickerPatient?.token ?? null}
        doctorId={selectedDoctorId}
      />
    </main>
  )
}

// ── Doctor Card (display only, no action) ────────────────────────────────────
const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`.toUpperCase()
  const specs = Array.isArray(doctor.specializations)
    ? doctor.specializations.slice(0, 2).join(' • ')
    : typeof doctor.specializations === 'string'
      ? doctor.specializations : ''

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden hover:shadow-md transition-all flex flex-col">
      {/* Banner */}
      <div className="relative h-32 bg-linear-to-br from-[#0297d6]/10 to-[#0297d6]/20 flex items-center justify-center">
        {doctor.photo
          ? <img src={doctor.photo} alt={doctor.firstName} className="w-full h-full object-cover" />
          : <span className="text-5xl font-black text-[#0297d6]/30">{initials}</span>}
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Online
        </span>
      </div>
      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <p className="font-bold text-slate-800 text-sm leading-tight">
          {doctor.title} {doctor.firstName} {doctor.lastName}
        </p>
        {specs
          ? <p className="text-[11px] text-[#0297d6] font-semibold">{specs}</p>
          : <p className="text-[11px] text-slate-300 italic">No specialization</p>}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
            <p className="text-sm font-bold text-slate-700">{doctor.experience} yr{doctor.experience !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0297d6]/10 flex items-center justify-center text-xs font-black text-[#0297d6]">
            {initials}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnlineConsultPage