'use client'
import { Activity, Search, X } from 'lucide-react'
import React, { useState, useMemo, useEffect } from 'react'
import TokenDialog from '../vitals/_components/TokenDialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiService } from '@/app/_utils/apiService';
import type { Patient, Prescription, PrescriptionWithPatient } from "@/app/_utils/types";

const page = () => {

    const [queue, setQueue] = useState<PrescriptionWithPatient[]>([]);
    const [searchToken, setSearchToken] = useState("");
    const [searchName, setSearchName] = useState("");
    const [search, setSearch] = useState("")
    const [expandedToken, setExpandedToken] = useState<string | null>(null);


    useEffect(() => {
        const loadQueue = async () => {
            const token = localStorage.getItem("token")
            if (!token) return console.log("User token not found")
            try {
                const res = await apiService.getAllPrescription(token);
                setQueue(res.data || []);
            } catch (err) {
                console.error("Failed to load prescriptions", err);
            }
        };

        loadQueue();
    }, []);

    const filteredPrescriptions = queue.filter((item) => {
        if (!search) return true;

        const query = search.toLowerCase();

        const fullName = `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.toLowerCase();
        const reversedName = `${item.patient.lastName || ""} ${item.patient.firstName || ""}`.toLowerCase();
        const token = String(item.token || "").toLowerCase();

        return (
            fullName.includes(query) ||
            reversedName.includes(query) ||
            token.includes(query)
        );
    });


    return (
        <main className="min-h-screen bg-slate-50">

            {/* Header */}
            <div className="w-full bg-[#0297d6] py-6 px-4 text-white">
                <div className="max-w-5xl mx-auto flex items-center gap-3 min-w-0">
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm shrink-0">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">EZShifa</h1>
                        <span className="opacity-50 text-sm shrink-0">|</span>
                        <p className="opacity-80 text-md truncate">Site: EZShifa • Digital Health Clinic</p>
                    </div>
                </div>
            </div>

            {/* Page body */}
            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Current Patient Queue */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">

                    {/* Header */}
                    <div className="px-8 py-4 border-b flex flex-col md:flex-row gap-3 md:items-center md:justify-between">

                        <h2 className="font-bold text-xl text-slate-800">
                            CURRENT MEDICATION QUEUE
                        </h2>

                        <div className="flex gap-3 w-full md:w-auto">

                            {/* Smart Search */}
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by token or name..."
                                className="border border-slate-200 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-[#0297d6]"
                            />

                            {/* Clear */}
                            <button
                                onClick={() => setSearch("")}
                                className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600"
                            >
                                Clear
                            </button>

                        </div>
                    </div>

                    <table className="w-full">

                        {/* TABLE HEAD */}
                        <thead className="bg-slate-50">
                            <tr className="text-sm text-slate-500 font-semibold">
                                <th className="px-8 py-4 text-left">SR. NO</th>
                                <th className="px-8 py-4 text-left">TOKEN NUMBER</th>
                                <th className="px-8 py-4 text-left">Name</th>
                                <th className="px-8 py-4 text-left">Phone Number</th>
                                <th className="px-8 py-4 text-right">Action</th>
                            </tr>
                        </thead>

                        {/* TABLE BODY */}
                        <tbody className="divide-y divide-slate-100">

                            {filteredPrescriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm">
                                        No patients found
                                        {search && ` matching "${search}"`}
                                    </td>
                                </tr>
                            ) : (
                                filteredPrescriptions.map((p, i) => {

                                    const isExpanded = expandedToken === p.token;

                                    return (
                                        <React.Fragment key={p.id}>

                                            {/* ROW */}
                                            <tr className="hover:bg-slate-50 transition-colors">

                                                <td className="px-8 py-5 text-slate-600 font-medium">
                                                    {i + 1}
                                                </td>

                                                <td className="px-8 py-5 font-bold text-[#0297d6]">
                                                    #{p.token}
                                                </td>

                                                <td className="px-8 py-5 text-slate-700">
                                                    {p.patient.firstName} {p.patient.lastName}
                                                </td>

                                                <td className="px-8 py-5 text-slate-700">
                                                    {p.patient.phoneNumber}
                                                </td>

                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() =>
                                                            setExpandedToken(isExpanded ? null : p.token)
                                                        }
                                                        className="bg-[#0297d6] hover:bg-[#0288c2] text-white px-6 py-2 rounded-xl text-sm font-bold"
                                                    >
                                                        {isExpanded ? "CLOSE" : "VIEW"}
                                                    </button>
                                                </td>

                                            </tr>

                                            {/* EXPANDED */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-6 bg-slate-50">

                                                        <div className="space-y-4">

                                                            {/* Patient Info */}
                                                            <div>
                                                                <p className="font-bold text-slate-800">
                                                                    {p.patient.firstName} {p.patient.lastName}
                                                                </p>

                                                                <p className="text-sm text-slate-500">
                                                                    Phone: {p.patient.phoneNumber}
                                                                </p>

                                                                <p className="text-sm text-slate-500">
                                                                    Diagnosis: {p.diagnosis || "N/A"}
                                                                </p>

                                                                <p className="text-sm text-slate-500">
                                                                    Lab Tests: {p.labTest || "N/A"}
                                                                </p>
                                                            </div>

                                                            {/* Medicines */}
                                                            <div className="space-y-2">
                                                                {p.medicines?.map((m) => (
                                                                    <div
                                                                        key={m.id}
                                                                        className="p-3 bg-white border rounded-xl flex justify-between"
                                                                    >
                                                                        <div>
                                                                            <p className="font-bold text-slate-800">
                                                                                {m.medicineName}
                                                                            </p>

                                                                            <p className="text-xs text-slate-500">
                                                                                {m.dosage} • {m.duration}
                                                                            </p>
                                                                        </div>

                                                                        <div className="text-xs font-bold text-slate-600">
                                                                            M:{m.morning ? 1 : 0} A:{m.afternoon ? 1 : 0} N:{m.night ? 1 : 0}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                        </div>

                                                    </td>
                                                </tr>
                                            )}

                                        </React.Fragment>
                                    );
                                })
                            )}

                        </tbody>
                    </table>
                </div>

            </div>
        </main>
    );
};

export default page;