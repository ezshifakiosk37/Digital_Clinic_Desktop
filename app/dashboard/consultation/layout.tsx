"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient"; 

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // 1. Check if we are in the browser and if notifications are supported
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const syncNotificationToken = async () => {
      try {
        const messaging = getMessaging(firebaseApp);

        // 2. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn("Doctor denied notification permissions.");
          return;
        }

        // 3. Get Token
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY 
        });

        if (token) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const jwt = localStorage.getItem('token');

          if (!apiUrl || !jwt) {
            console.error("Missing API URL or JWT Token");
            return;
          }

          // 4. Send to Express
          const response = await fetch(`${apiUrl}/notifications/save-doctor-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({ token })
          });

          const data = await response.json();
          if (data.success) {
            console.log("✅ Doctor's device registered for calls.");
          }
        }

        // 5. Professional Foreground Listener
        onMessage(messaging, (payload) => {
          console.log("Foreground call received:", payload);
          
          // Logic: Play a ringing sound
          const audio = new Audio('/sounds/incoming-call.mp3');
          audio.play().catch(e => console.log("Audio play blocked until user interacts"));

          // Logic: Show a custom UI/Toast instead of alert
          // Example: toast.success(`Incoming Call: ${payload.notification?.body}`);
          alert(`In-App Alert: ${payload.notification?.title}\n${payload.notification?.body}`);
        });

      } catch (err) {
        console.error("❌ Notification Sync Error:", err);
      }
    };

    syncNotificationToken();
  }, []);

  return <section className="min-h-screen bg-gray-50">{children}</section>;
}