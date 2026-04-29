"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient";
import IncomingCallModal from './components/IncomingCallModel';
import { AndroidBridge } from '../../_utils/AndroidBridges/AndroidBridge';

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    if (typeof window === "undefined") return;

    // --- 1. LOGIN CHECK (GUARD CLAUSE) ---
    const jwt = localStorage.getItem('doc_token')
    
    if (!jwt) {
      console.log("🚪 No doctor session found. Skipping FCM registration.");
      return; // Stop everything if the doctor isn't logged in
    }

    // Helper to save token to your existing backend
    const saveTokenToBackend = async (token: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;

      try {
        const response = await fetch(`${apiUrl}/api/notifications/save-doctor-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}` // We already know jwt exists here
          },
          body: JSON.stringify({ token })
        });
        const data = await response.json();
        if (data.success) console.log("✅ Device registered successfully.");
      } catch (err) {
        console.error("❌ Failed to save token to backend:", err);
      }
    };

    // --- 2. BRANCH LOGIC (Only runs if logged in) ---
    
    if (window.AndroidNative) {
      console.log("📱 Running in Android App: Using Native FCM Bridge");

      AndroidBridge.initFcmListener((token) => {
        console.log("✅ Native FCM Token acquired:", token);
        saveTokenToBackend(token);
      });

      AndroidBridge.requestNativeFcmToken();

    } else if ("Notification" in window) {
      const syncWebNotificationToken = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;

          const messaging = getMessaging(firebaseApp);
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (token) {
            console.log("🌐 Web FCM Token acquired:", token);
            saveTokenToBackend(token);
          }

          onMessage(messaging, (payload) => {
            console.log("Foreground call received (Web):", payload);
            const vitalsId = payload.data?.vitalsId;
            if (!vitalsId) return;

            window.dispatchEvent(new CustomEvent('incoming-call', {
              detail: {
                vitalsId,
                title: payload.notification?.title,
                body: payload.notification?.body,
                callUrl: `/dashboard/video-call/${vitalsId}`
              }
            }));
          });
        } catch (err) {
          console.error("❌ Web Notification Sync Error:", err);
        }
      };

      syncWebNotificationToken();
    }
  }, []); // Runs on mount

  return (
    <section className="min-h-screen bg-gray-50">
      <IncomingCallModal />
      {children}
    </section>
  );
}