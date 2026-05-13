// consultation/components/Navbar.tsx
"use client";
import React from 'react';
import { LogOut, Menu } from 'lucide-react';

interface NavbarProps {
  fullName: string;
  doctorPhoto?: string;
  onProfileClick: () => void;
  onLogoutClick: () => void;
  doctorStatus: 'online' | 'offline';
  togglingStatus: boolean;
  onToggleStatus: () => void;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  fullName,
  doctorPhoto,
  onProfileClick,
  onLogoutClick,
  doctorStatus,
  togglingStatus,
  onToggleStatus,
  onMenuClick,
}) => {
  return (
    <nav className="bg-[#0297d6] sticky top-0 z-50 px-3 py-2.5 flex justify-between items-center shadow-md text-white text-[14px] leading-none">
      {/* Left Side - Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/20 transition-colors shrink-0"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <div className="font-black text-[14px] md:text-2xl tracking-tighter leading-tight">DOCTOR'S PORTAL</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/80">
            EZSHIFA DIGITAL CLINIC
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">

        {/* Doctor name — always visible */}
        <div className="text-right hidden md:block">
          <p className="text-[12px] font-semibold uppercase tracking-wide leading-tight max-w-[120px] truncate">{fullName}</p>
        </div>

        {/* Status label — always visible */}
        <span className="text-[12px] font-bold text-white/80">
          {doctorStatus === 'online' ? 'Online' : 'Offline'}
        </span>

        {/* Status Toggle */}
        <button
          onClick={onToggleStatus}
          disabled={togglingStatus}
          className={`relative w-9 h-5 md:w-11 md:h-6 rounded-full transition-colors duration-300 focus:outline-none shrink-0 ${doctorStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
            } ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow transition-transform duration-300 ${doctorStatus === 'online' ? 'translate-x-4 md:translate-x-5' : 'translate-x-0'
            }`} />
        </button>

        {/* Profile Avatar */}
        <div
          onClick={onProfileClick}
          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center text-[#0297d6] font-bold text-sm md:text-lg border-2 border-white/30 cursor-pointer hover:border-white transition-all overflow-hidden shrink-0"
        >
          {doctorPhoto ? (
            <img src={doctorPhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            fullName.split(' ').filter((_, i) => i !== 0).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;