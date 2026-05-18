export const CallStatusBadge = ({ status }: { status?: string }) => {
    const map: Record<string, { label: string; className: string }> = {
        waiting: { label: '⏳ Waiting', className: 'bg-yellow-100 text-yellow-700' },
        pending: { label: '🔔 Pending', className: 'bg-blue-100 text-blue-700' },
        accepted: { label: '✅ Accepted', className: 'bg-green-100 text-green-700' },
        declined_by_patient: { label: '❌ Declined (Patient)', className: 'bg-red-100 text-red-600' },
        declined_by_doctor: { label: '❌ Declined (Doctor)', className: 'bg-red-100 text-red-600' },
        doctor_not_responding: { label: '📵 missed', className: 'bg-orange-100 text-orange-600' },
        completed: { label: '✓ Completed', className: 'bg-emerald-100 text-emerald-700' },
    };

    const s = status ? map[status] : null;
    if (!s) return <span className="text-xs text-slate-400">—</span>;

    return (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${s.className}`}>
            {s.label}
        </span>
    );
};