"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient";
import GlobalCallSidebar from './components/GlobalCallSidebar';
import { AndroidBridge } from '../../_utils/AndroidBridges/AndroidBridge';
import { apiService } from '@/app/_utils/apiService';
import { CallQueueProvider, useCallQueue } from '@/app/_context/CallQueueContext';

// Inner layout that can access context
function ConsultationInner({ children }: { children: React.ReactNode }) {
  const { addCall } = useCallQueue();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const jwt = localStorage.getItem('doc_token');
    if (!jwt) return;

    const saveTokenToBackend = async (token: string) => {
      try {
        const res = await apiService.saveDoctorFcmToken(token);
        if (res.success) console.log("Device registered.");
      } catch (err: any) {
        console.error("FCM save failed:", err.message);
      }
    };

    const handleIncomingCall = (payload: any) => {
      const vitalsId = payload?.vitalsId || payload?.data?.vitalsId;
      if (!vitalsId) return;

      addCall({
        vitalsId,
        title: payload?.notification?.title || payload?.title || 'Incoming Call',
        body:  payload?.notification?.body  || payload?.body  || '',
        callUrl: `/dashboard/video-call/${vitalsId}`,
        token:    payload?.data?.token,
        symptoms: payload?.data?.symptoms,
      });
    };

    if (window.AndroidNative) {
      AndroidBridge.initFcmListener((token) => saveTokenToBackend(token));
      AndroidBridge.requestNativeFcmToken();

      // Android delivers call payloads via this event
      window.addEventListener('incoming-call', (e: Event) => {
        handleIncomingCall((e as CustomEvent).detail);
      });

    } else if ("Notification" in window) {
      const syncWeb = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;

          const messaging = getMessaging(firebaseApp);
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
            serviceWorkerRegistration: reg,
          });
          if (token) saveTokenToBackend(token);

          onMessage(messaging, (payload) => {
            handleIncomingCall(payload);
          });
        } catch (err) {
          console.error("Web FCM error:", err);
        }
      };
      syncWeb();
    }
  }, []);

  return (
    <section className="min-h-screen bg-gray-50">
      <GlobalCallSidebar />
      {children}
    </section>
  );
}

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return (
    <CallQueueProvider>
      <ConsultationInner>{children}</ConsultationInner>
    </CallQueueProvider>
  );
}