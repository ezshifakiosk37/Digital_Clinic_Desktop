"use client"
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, User, Activity, LogOut, ChevronRight, Menu, X, RefreshCw, Wifi,
  PresentationIcon,
  Stethoscope,
  BriefcaseMedical
} from 'lucide-react';
import { MenuItem } from '@/app/_utils/types';
import Image from 'next/image';
import logo from "@/public/logo2.png"
import logoSmall from "@/public/logosmall.png"
import { usePathname, useRouter } from 'next/navigation';
import { apiService } from '@/app/_utils/apiService';
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';

export default function Sidebar() {
  const isDoctor = !!localStorage.getItem('doc_token');
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReconnectButton, setShowReconnectButton] = useState(false); // 👈 new state
  const router = useRouter();

  const staffMenuItems: MenuItem[] = [
    { name: "Demographic", path: "/dashboard/demographic", icon: <User size={20} /> },
    { name: "Vitals", path: "/dashboard/vitals", icon: <Activity size={20} /> },
    { name: "Online Consultation", path: "/dashboard/onlineConsult", icon: <Stethoscope size={20} /> },
    { name: "Pharmacy", path: "/dashboard/pharmacy", icon: <BriefcaseMedical size={20} /> },
  ];

  const doctorMenuItems: MenuItem[] = [
    { name: "Consultation", path: "/dashboard/consultation", icon: <LayoutDashboard size={20} /> },
    { name: "Profile", path: "/dashboard/consultation/profile", icon: <User size={20} /> },
  ];

  const menuItems = isDoctor ? doctorMenuItems : staffMenuItems;

  // 1. Detect Android bridge availability
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AndroidNative) {
      setShowReconnectButton(true);
    } else {
      setShowReconnectButton(false);
    }
  }, []);

  // 2. Initialize Hardware Status Listener
  useEffect(() => {
    AndroidBridge.initHardwareListeners(
      (data) => {
        console.log("Sidebar global data received:", data);
      },
      (status) => {
        console.log("Hardware Status Update:", status);
        const finalStatuses = ["CONNECTED", "ERROR", "DEVICE_NOT_FOUND", "ALREADY_CONNECTED", "PERMISSION_REQUESTED", "OPEN_FAILED"];
        if (finalStatuses.includes(status)) {
          setIsConnecting(false);
        }
      }
    );
  }, []);

  // 3. Reconnect Trigger
  const onReconnectPress = () => {
    setIsConnecting(true);
    const success = AndroidBridge.handleReconnect();
    if (!success) {
      setIsConnecting(false);
      console.warn("Bridge not available.");
    }
  };

  const handleSignOut = () => {
    if (isDoctor) {
      window.dispatchEvent(new CustomEvent('doctor-logout-requested'));
      setIsOpen(false);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('localClinic_entryId');
      router.push("/sign-in");
    }
  };

  const handleRouteChange = (path: string, name?: string) => {
    if (isDoctor && name === 'Profile') {
      window.dispatchEvent(new CustomEvent('doctor-show-profile'));
      setActiveTab('/dashboard/consultation/profile');
      setIsOpen(false);
      return;
    }
    if (isDoctor && name === 'Consultation') {
      window.dispatchEvent(new CustomEvent('doctor-show-dashboard'));
      setActiveTab('/dashboard/consultation');
      setIsOpen(false);
      return;
    }
    setActiveTab(path);
    router.push(path);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isDoctor) {
      setActiveTab('/dashboard/consultation');
    } else {
      setActiveTab(pathname);
    }
  }, [pathname, isDoctor]);

  useEffect(() => {
    const handleMobileToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleMobileToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleMobileToggle);
  }, []);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-dvh z-60 bg-white border-r border-slate-200
          shadow-xl shadow-black/15 flex flex-col
          transition-all duration-300
          ${isOpen ? 'w-64 px-6' : 'w-0 md:w-16 px-0 md:px-2 overflow-hidden'}
        `}
      >
        {/* Logo + Hamburger */}
        <div className={`py-4 mb-2 flex items-center gap-2 min-h-20 ${isOpen ? 'flex-row justify-between w-full' : 'flex-col justify-center'}`}>
          <div className="transition-all duration-300">
            {isOpen ? (
              <Image alt="logo" src={logo} height={600} width={600} className="w-36 object-contain" />
            ) : (
              <Image alt="logo" src={logoSmall} height={80} width={80} className="w-10 h-10 object-contain" />
            )}
          </div>
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Nav Label */}
        <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Main Menu
        </p>

        {/* Nav Items */}
        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => {
            const isActive = isDoctor
              ? activeTab === item.path
              : pathname.startsWith(item.path);
            return (
              <button
                key={item.name}
                onClick={() => handleRouteChange(item.path, item.name)}
                title={item.name}
                className={`w-full group flex cursor-pointer items-center justify-between gap-3 p-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                  ? "bg-[#0297d6] text-white scale-[1.02]"
                  : "text-slate-500 bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  {isOpen && (
                    <span className="text-sm whitespace-nowrap">{item.name}</span>
                  )}
                </div>
                <div className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {isActive
                    ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    : <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                  }
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="w-full flex items-center cursor-pointer gap-3 px-2 py-3 text-slate-500 font-bold hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all group justify-center"
          >
            <div className="bg-slate-100 group-hover:bg-red-100 p-2 rounded-lg transition-colors shrink-0">
              <LogOut size={18} />
            </div>
            {isOpen && (
              <span className="text-sm whitespace-nowrap">Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Floating Reconnect Button (only shown when Android bridge is available) ── */}
      {showReconnectButton && (
        <button
          onClick={onReconnectPress}
          disabled={isConnecting}
          className="fixed bottom-6 left-6 z-50 p-4 bg-[#0297d6] text-white rounded-full shadow-2xl transition-all duration-200 group
            md:flex hidden
            ${isConnecting ? 'opacity-80 cursor-wait' : 'hover:bg-[#0286c2] hover:scale-110 active:scale-95'}"
          title="Reconnect to ESP32"
        >
          <RefreshCw
            size={28}
            className={`transition-transform duration-700 ${isConnecting ? 'animate-spin' : 'group-hover:rotate-180'}`}
          />
        </button>
      )}
    </>
  );
}