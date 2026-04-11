// consultation/components/Navbar.tsx
"use client";
import React from 'react';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  fullName: string;
  doctorPhoto?: string;       // optional photo URL
  onProfileClick: () => void;
  onLogoutClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  fullName,
  doctorPhoto,
  onProfileClick,
  onLogoutClick,
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