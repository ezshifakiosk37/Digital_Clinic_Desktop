// consultation/docSignin.tsx
"use client";
import React, { useState } from 'react';
import { apiService } from '@/app/_utils/apiService';

interface DocSigninProps {
    setActivePage: React.Dispatch<React.SetStateAction<'login' | 'signup' | 'dashboard' | 'profile'>>;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const DocSignin: React.FC<DocSigninProps> = ({ setActivePage, setIsLoggedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiService.docLogin({ email, password });

            // Immediately update doctor state in parent (page.tsx)
            if (data.doctor) {
                // This will trigger re-render with correct doctor
                window.dispatchEvent(new Event('doctorLoggedIn'));
            }

            setIsLoggedIn(true);
            setActivePage('dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
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
                        <img src="/logo.png" alt="EZShifa Logo" className="max-w-48 h-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <div className="text-white text-center">
                        <h2 className="text-3xl font-black leading-snug">Digital Health Clinic</h2>
                        <p className="text-sm opacity-75 font-semibold mt-1">Professional healthcare network, Karachi.</p>
                    </div>
                    <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">© 2026 EZShifa</div>
                </div>

                {/* Right Panel - Login */}
                <div className="flex-1 px-8 py-8 lg:py-1 lg:mb-2 overflow-y-auto max-h-[90vh]">
                    <h1 className="text-4xl font-black text-slate-800">Welcome Back</h1>
                    <p className="text-slate-400 font-semibold text-sm mt-1 mb-6">Login to your dashboard</p>

                    <form className="space-y-4" onSubmit={handleLogin}>
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-base border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 rounded-2xl font-semibold text-base border-2 border-transparent focus:border-[#0297d6] outline-none" required />
                        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-semibold">{error}</div>}
                        <button disabled={loading} className="w-full bg-[#0297d6] disabled:opacity-60 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-md mt-6">{loading ? 'Logging in...' : 'Login'}</button>
                    </form>

                    <button
                        onClick={() => setActivePage('signup')}
                        className="w-full mt-4 text-xs font-black text-slate-700 hover:text-[#0297d6] uppercase tracking-widest"
                    >
                        Create an account →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocSignin;