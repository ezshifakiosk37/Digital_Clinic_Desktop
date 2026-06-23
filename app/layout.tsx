import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { CallQueueProvider } from "./_context/CallQueueContext";
import { Providers } from "./Provider";

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
  viewport: {
    width: "device-width",
    initialScale: 1,
    interactiveWidget: "resizes-content", // <-- KEY: Enables the CSS variable
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}>
        <CallQueueProvider>
          {/* FIX: minHeight forces the wrapper to overflow the body when keyboard opens */}
          <div style={{ 
            minHeight: '100dvh', 
            paddingBottom: 'env(keyboard-inset-height, 0px)' 
          }}>
            <Providers>
              {children}
            </Providers>
          </div>
        </CallQueueProvider>
      </body>
    </html>
  );
}