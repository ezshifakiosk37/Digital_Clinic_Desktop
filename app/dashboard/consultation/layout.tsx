"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient";
import IncomingCallModal from './components/IncomingCallModel';

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const syncNotificationToken = async () => {
      try {
        // 1. Request Permission FIRST
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn("Doctor denied notification permissions.");
          return;
        }

        // 2. Explicitly register and WAIT for the service worker
        if (!('serviceWorker' in navigator)) {
          console.error("Service workers not supported.");
          return;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // 3. Wait until the SW is actually active (not just installing)
        await navigator.serviceWorker.ready;
        console.log("✅ Service Worker is ready:", registration.scope);

        // 4. NOW get the token, passing the SW registration explicitly
        const messaging = getMessaging(firebaseApp);
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          serviceWorkerRegistration: registration, // ← critical
        });

        if (!token) {
          console.error("❌ getToken() returned null — check VAPID key and SW registration.");
          return;
        }

        console.log("✅ FCM Token acquired:", token);

        // 5. Save to backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const jwt = localStorage.getItem('doc_token');

        if (!apiUrl || !jwt) {
          console.error("Missing API URL or JWT Token");
          return;
        }

        const response = await fetch(`${apiUrl}/api/notifications/save-doctor-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        console.log("Save token response:", data);

        if (data.success) {
          console.log("✅ Doctor's device registered for calls.");
        } else {
          console.error("❌ Failed to save token:", data.error);
        }

        // 6. Foreground message listener
        onMessage(messaging, (payload) => {
          console.log("Foreground call received:", payload);

          const vitalsId = payload.data?.vitalsId;
          const callerName = payload.notification?.body;

          if (!vitalsId) return;

          // Play sound (needs user interaction first — move audio to after user clicks accept)
          // Don't autoplay here, it will be blocked

          // Show a proper incoming call UI instead of alert()
          // Option 1: use a custom event to trigger a modal in your UI
          window.dispatchEvent(new CustomEvent('incoming-call', {
            detail: {
              vitalsId,
              title: payload.notification?.title,
              body: callerName,
              callUrl: `/dashboard/video-call/${vitalsId}`
            }
          }));
        });

      } catch (err) {
        console.error("❌ Notification Sync Error:", err);
      }
    };

    syncNotificationToken();
  }, []);

  return (
  <section className="min-h-screen bg-gray-50">
    <IncomingCallModal />
    {children}
  </section>
  )
}