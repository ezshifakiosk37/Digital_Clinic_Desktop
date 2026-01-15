"use client"
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  User,
  Activity,
  LogOut,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { MenuItem } from '@/app/_utils/types';
import Image from 'next/image';
import logo from "@/public/logo2.png"
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter()
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    { name: "Appointments", path: "/dashboard/appointments", icon: <LayoutDashboard size={20} /> },
    { name: "Demographic", path: "/dashboard/demographic", icon: <User size={20} /> },
    { name: "Vitals", path: "/dashboard/vitals", icon: <Activity size={20} /> },
  ];

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/sign-out", {
        method: "POST", // This MUST match the API export name
      });

      if (response.ok) {
        // 1. Move the user to the sign-in page
        router.push("/sign-in");

        // 2. Refresh the router to clear current session state from middleware
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleRouteChange = (path: string) => {
    setActiveTab(path)
    router.push(path)
  }

  useEffect(() => {
    setActiveTab(pathname)
  },[])

  return (
    <aside className="w-full px-8 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="py-12 mb-2">
        <div className="flex items-center gap-3 px-2">
          <Image alt='/' src={logo} height={600} width={600} className='w-50' />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        <p className=" text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = activeTab === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleRouteChange(item.path)}
              className={`w-full group flex cursor-pointer items-center justify-between gap-3 p-4 rounded-2xl font-semibold transition-all duration-200 relative ${isActive
                  ? "bg-primary text-white shadow-xl shadow-blue-100 scale-[1.02]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </div>

              {isActive ? (
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-pulse" />
              ) : (
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              )}
            </button>
          );
        })}
      </nav>

    
      {/* Sign Out Action */}
      <div className="p-4 border-t border-slate-400 bg-white">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center cursor-pointer gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-secondary/5 hover:text-secondary rounded-2xl transition-all group"
        >
          <div className="bg-slate-100 group-hover:bg-red-100 p-2 rounded-lg transition-colors">
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
