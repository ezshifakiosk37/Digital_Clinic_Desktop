"use client"; // Mandatory: You cannot check localStorage on the server

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Logic: Check the "ID badge" (token)
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    if (token) {
      // Logic: User is already logged in, send them to work
      router.replace("/dashboard/demographic");
    } else {
      // Logic: No session found, send them to the entry gate
      router.replace("/sign-in");
    }
  }, [router]);

  // Logic: Display a clean, branded loader while the brain decides where to go
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Replace with your actual logo if you want */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0296d6] border-t-transparent"></div>
        <p className="text-gray-400 text-sm animate-pulse font-medium">
          Loading Digital Clinic..
        </p>
      </div>
    </div>
  );
}