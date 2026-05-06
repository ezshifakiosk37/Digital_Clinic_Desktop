// consultation/components/Navbar.tsx
"use client";
import React from 'react';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  fullName: string;
  doctorPhoto?: string;
  onProfileClick: () => void;
  onLogoutClick: () => void;
  doctorStatus: 'online' | 'offline';
  togglingStatus: boolean;
  onToggleStatus: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  fullName,
  doctorPhoto,
  onProfileClick,
  onLogoutClick,
  doctorStatus,
  togglingStatus,
  onToggleStatus,
}) => {
  return (
    <nav className="bg-[#0297d6] sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-md text-white">
      {/* Left Side - Logo / Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="font-black text-2xl tracking-tighter">DOCTOR'S PORTAL</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 -mt-1">
            EZSHIFA DIGITAL CLINIC
          </div>
        </div>
      </div>

      {/* Right Side - Doctor Info + Avatar */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold uppercase tracking-wide">{fullName}</p>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${doctorStatus === 'online' ? 'text-pink-800' : 'text-black'}`}>
            {doctorStatus === 'online' ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={onToggleStatus}
            disabled={togglingStatus}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${doctorStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
              } ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${doctorStatus === 'online' ? 'translate-x-5' : 'translate-x-0'
              }`} />
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogoutClick}
          className="hidden sm:flex items-center gap-1.5 text-xs font-bold opacity-90 hover:opacity-100 transition-all"
        >
          <LogOut size={14} />
          LOGOUT
        </button>

        {/* Profile Avatar */}
        <div
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0297d6] font-bold text-lg border-2 border-white/30 cursor-pointer hover:border-white transition-all overflow-hidden"
        >
          {doctorPhoto ? (
            <img
              src={doctorPhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            fullName
              .split(' ')
              .filter((_, i) => i !== 0)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;