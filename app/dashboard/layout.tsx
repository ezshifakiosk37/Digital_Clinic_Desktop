"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./_components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Logic: Check if the token exists in localStorage
        const token = localStorage.getItem("user");

        if (!token) {
            // Logic: Redirect to sign-in if no token is found
            console.warn("No token found, redirecting to sign-in.");
            router.push("/sign-in");
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    // Logic: Prevent the Sidebar and children from rendering at all until authorized
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
        <div className="flex min-h-dvh bg-[#0296d610]">
            <Sidebar />
            <main className="flex-1 min-h-dvh pl-16 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}