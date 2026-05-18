"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./_components/Sidebar";

// Pages only staff can access
const STAFF_ONLY_PATHS = [
  "/dashboard/demographic",
  "/dashboard/vitals",
  "/dashboard/onlineConsult",
  "/dashboard/pharmacy",
];

// Pages only doctors can access
const DOCTOR_ONLY_PATHS = [
  "/dashboard/consultation",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const staffToken = localStorage.getItem("user");
    const docToken   = localStorage.getItem("doc_token");

    const isDoctor = !!docToken;
    const isStaff  = !!staffToken;

    // Not logged in at all
    if (!isDoctor && !isStaff) {
      router.replace("/sign-in");
      return;
    }

    const isStaffOnlyPage  = STAFF_ONLY_PATHS.some(p => pathname.startsWith(p));
    const isDoctorOnlyPage = DOCTOR_ONLY_PATHS.some(p => pathname.startsWith(p));

    // Doctor trying to access staff page
    if (isDoctor && isStaffOnlyPage) {
      router.replace("/dashboard/consultation");
      return;
    }

    // Staff trying to access doctor page
    if (isStaff && !isDoctor && isDoctorOnlyPage) {
      router.replace("/dashboard/demographic");
      return;
    }

    setIsAuthorized(true);
  }, [router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse text-[#0296d6] font-bold">
          Verifying Session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0296d610]">
      <Sidebar />

      {/* ✅ Floating hamburger — mobile only, outside sidebar so always visible */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className="fixed top-3 left-3 z-50 md:hidden bg-white border border-slate-200 shadow-md p-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Open menu"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <main className="flex-1 min-h-screen pl-0 md:pl-16 transition-all duration-300">
        {children}
      </main>
    </div>
  );

}

