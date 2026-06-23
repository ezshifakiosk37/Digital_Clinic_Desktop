import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { CallQueueProvider } from "./_context/CallQueueContext";
import { EcgGlobalListener } from "./dashboard/vitals/_components/EcgGlobalListener";
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
    // This is the magic line: tells the browser to resize the visual viewport 
    // and update the CSS environment variable when the keyboard appears.
    interactiveWidget: "resizes-content", 
  },
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
        <CallQueueProvider>
          <div style={{ paddingBottom: 'env(keyboard-inset-height, 0px)' }}>
            <Providers>
              {children}
            </Providers>
          </div>
        </CallQueueProvider>
      </body>
    </html>
  );
}