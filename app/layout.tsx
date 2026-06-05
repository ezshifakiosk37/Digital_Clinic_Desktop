import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { CallQueueProvider } from "./_context/CallQueueContext";
import { EcgGlobalListener } from "./dashboard/vitals/_components/EcgGlobalListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Outfit({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "EZBifurcation",
  description: "A complete digitized clinic structure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body
        style={{
          height: "100%",
          margin: 0,
          overflow: "auto",
        }}
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
      >
        <EcgGlobalListener/>
        <CallQueueProvider>
          <div>
            {children}
          </div>
        </CallQueueProvider>
      </body>
    </html>
  );
}