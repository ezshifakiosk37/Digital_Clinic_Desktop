'use client'
import { Activity,RefreshCw } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { apiService } from '@/app/_utils/apiService'
import { VideoConsultModel } from '../vitals/_components/VideoConsultModel'
import { QueueItem } from '@/app/_utils/types'


const parseSymptoms = (raw: string | null | undefined): string[] => {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
    } catch { }
    return raw.split(',').map(s => s.trim()).filter(Boolean)
}

const OnlineConsultPage = () => {
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [search, setSearch] = useState("")
    const [expandedToken, setExpandedToken] = useState<string | null>(null)
    const [videoVitalsId, setVideoVitalsId] = useState<string | null>(null)
    const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null)
    const [refreshing, setRefreshing] = useState(false)

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

    return (
        <main className="min-h-screen bg-slate-50">

            {/* Header */}
            <div className="w-full bg-[#0297d6] py-6 px-4 text-white">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">EZShifa</h1>
                        <span className="opacity-50 text-sm">|</span>
                        <p className="opacity-80 text-md truncate">Online Consultation Queue</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

                    {/* Table header bar */}
                    <div className="px-8 py-4 border-b flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <h2 className="font-bold text-xl text-slate-800">ONLINE CONSULTATION QUEUE</h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by token or name..."
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-[#0297d6]"
                            />
                            <button
                                onClick={() => setSearch("")}
                                className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => loadQueue(true)}
                                disabled={refreshing}
                                title="Refresh queue"
                                className="px-4 py-2 text-sm rounded-lg bg-[#0297d6] hover:bg-[#0288c2] disabled:opacity-60 text-white font-bold flex items-center gap-1.5"
                            >
                                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr className="text-sm text-slate-500 font-semibold">
                                    <th className="px-6 py-4 text-left">SR. NO</th>
                                    <th className="px-6 py-4 text-left">TOKEN</th>
                                    <th className="px-6 py-4 text-left">NAME</th>
                                    <th className="px-6 py-4 text-left">PHONE</th>
                                    <th className="px-6 py-4 text-left">SYMPTOMS</th>
                                    <th className="px-6 py-4 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm">
                                            No online consultation patients found
                                            {search && ` matching "${search}"`}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((p, i) => {
                                        const symptoms = parseSymptoms(p.symptoms)
                                        const isExpanded = expandedToken === p.token

                                        return (
                                            <React.Fragment key={p.id}>
                                                <tr className="hover:bg-slate-50 transition-colors">

                                                    <td className="px-6 py-5 text-slate-600 font-medium">{i + 1}</td>

                                                    <td className="px-6 py-5 font-bold text-[#0297d6]">#{p.token}</td>

                                                    <td className="px-6 py-5 text-slate-700 font-medium">
                                                        {p.firstName} {p.lastName}
                                                    </td>

                                                    <td className="px-6 py-5 text-slate-700">
                                                        {p.phoneNumber ?? '—'}
                                                    </td>

                                                    {/* Symptoms */}
                                                    <td className="px-6 py-5">
                                                        {symptoms.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {symptoms.slice(0, 2).map((s, idx) => (
                                                                    <span key={idx} className="text-xs font-semibold bg-[#0297d6]/10 text-[#0297d6] px-2 py-0.5 rounded-full">
                                                                        {s.startsWith('Other:') ? `Other: ${s.slice(6)}` : s}
                                                                    </span>
                                                                ))}
                                                                {symptoms.length > 2 && (
                                                                    <button
                                                                        onClick={() => setExpandedToken(isExpanded ? null : p.token)}
                                                                        className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full hover:bg-slate-200"
                                                                    >
                                                                        +{symptoms.length - 2} more
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-sm">—</span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                onClick={() => p.vitalsId ? setSelectedPatient(p) : null}
                                                                disabled={!p.vitalsId}
                                                                title={!p.vitalsId ? "Add vitals first" : "Start online consult"}
                                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors
                                                                    ${p.vitalsId
                                                                        ? 'bg-[#0297d6] hover:bg-[#0288c2] text-white'
                                                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                💻 Consult
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded symptoms row */}
                                                {isExpanded && symptoms.length > 2 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-4 bg-slate-50">
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">All Symptoms</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {symptoms.map((s, idx) => (
                                                                    <span key={idx} className="text-xs font-semibold bg-[#0297d6]/10 text-[#0297d6] px-3 py-1 rounded-full border border-[#0297d6]/20">
                                                                        {s.startsWith('Other:') ? `Other: ${s.slice(6)}` : s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Reuse existing VideoConsultModel */}
            <VideoConsultModel
                isOpen={!!selectedPatient}
                onClose={() => setSelectedPatient(null)}
                vitalsId={selectedPatient?.vitalsId ?? null}
                patientId={selectedPatient?.id ?? null}
                patientToken={selectedPatient?.token ?? null}
            />
        </main>
    )
}

export default OnlineConsultPage