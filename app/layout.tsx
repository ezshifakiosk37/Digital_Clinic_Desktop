import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { CallDataProvider } from "./_context/CallDataContext";
import { CallQueueProvider } from "./_context/CallQueueContext";

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
  weight: ['300', '400'], // Optional: specify weights
});

export const metadata: Metadata = {
  title: "EZBifurcation",
  description: "A complete digitized clinic structure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
      >
        <CallQueueProvider>
          <CallDataProvider>
            {children}
          </CallDataProvider>
        </CallQueueProvider>
      </body>
    </html>
  );
}
