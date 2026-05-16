"use client";
import { useEffect, useRef, useCallback } from 'react';
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient";
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';
import { apiService } from '@/app/_utils/apiService';
import { useCallQueue } from '@/app/_context/CallQueueContext';
import GlobalCallSidebar from "./components/GlobalCallSidebar";

const FCM_CACHE_KEY = 'fcm_token';

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  const messagingRef = useRef<ReturnType<typeof getMessaging> | null>(null);
  const fcmTokenRef = useRef<string | null>(null);
  const fcmListenerRef = useRef<(() => void) | null>(null);
  const fcmRegisteredRef = useRef(false);

  const { addCall } = useCallQueue();

  const buildCallPayload = (payload: any) => {
    const vitalsId = payload?.vitalsId || payload?.data?.vitalsId;
    const patientId = payload?.patientId || payload?.data?.patientId;
    const patientToken = payload?.patientToken || payload?.data?.patientToken || payload?.data?.token;
    return {
      vitalsId,
      title: payload?.notification?.title || payload?.title || 'Incoming Call',
      body: payload?.notification?.body || payload?.body || '',
      callUrl: `/dashboard/video-call/${vitalsId}`,
      token: payload?.data?.token,
      symptoms: payload?.data?.symptoms,
      patientId,
      patientToken,
      status: 'waiting' as const,
    };
  };

  const registerFcm = useCallback(async () => {
    console.log("[FCM] registerFcm() called, already registered:", fcmRegisteredRef.current);
    if (fcmRegisteredRef.current) return;

    const jwt = localStorage.getItem('doc_token');
    console.log("[FCM] doc_token present:", !!jwt);
    if (!jwt) return;

    const saveToken = async (token: string) => {
      console.log("[FCM] saveToken() called with token length:", token?.length);
      fcmTokenRef.current = token;
      try {
        const res = await apiService.saveDoctorFcmToken(token);
        console.log("[FCM] saveDoctorFcmToken response:", res); // ← full response
      } catch (err: any) {
        console.error("[FCM] Save failed:", err.message);
      }
    };

    const handleIncomingCall = (payload: any) => {
      const call = buildCallPayload(payload);
      if (!call.vitalsId) return;
      addCall(call);
    };

    if (typeof window === 'undefined') return;

    if (window.AndroidNative) {
      AndroidBridge.initFcmListener((token) => saveToken(token));
      AndroidBridge.requestNativeFcmToken();
      const androidHandler = (e: Event) => handleIncomingCall((e as CustomEvent).detail);
      window.addEventListener('incoming-call', androidHandler);
      fcmListenerRef.current = () => window.removeEventListener('incoming-call', androidHandler);

    } else if ("Notification" in window) {
      try {
        const cachedToken = localStorage.getItem(FCM_CACHE_KEY);
        console.log("[FCM] Cached token present:", !!cachedToken, "| length:", cachedToken?.length);

        if (cachedToken) {
          console.log("[FCM] Cached token found — syncing with DB and setting up listener...");
          // ✅ Always re-sync DB even with cached token
          // Covers the case where DB was wiped by a previous unregister
          await saveToken(cachedToken);

          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;
          const messaging = getMessaging(firebaseApp);
          messagingRef.current = messaging;
          fcmListenerRef.current = onMessage(messaging, handleIncomingCall);

        } else {
          console.log("[FCM] No cached token — requesting permission and generating...");
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn("[FCM] Permission denied.");
            return;
          }

          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;

          const messaging = getMessaging(firebaseApp);
          messagingRef.current = messaging;

          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
            serviceWorkerRegistration: reg,
          });

          if (token) {
            localStorage.setItem(FCM_CACHE_KEY, token);
            await saveToken(token);
          }

          fcmListenerRef.current = onMessage(messaging, handleIncomingCall);
        }

      } catch (err) {
        console.error("[FCM] Web setup error:", err);
        return;
      }
    }

    fcmRegisteredRef.current = true;
  }, [addCall]);

  // In unregisterFcm — add backend cleanup alongside Firebase cleanup
const unregisterFcm = useCallback(async (shouldCleanup: boolean = true) => {
  if (!fcmRegisteredRef.current) return;

  if (fcmListenerRef.current) {
    fcmListenerRef.current();
    fcmListenerRef.current = null;
  }

  if (window.AndroidNative) {
    try {
      if (typeof window.AndroidNative.unregisterFcmDevice === 'function') {
        window.AndroidNative.unregisterFcmDevice();
      }
    } catch {}

  } else if (shouldCleanup) {
    // 1️⃣ Remove old token from your backend DB first
    const cachedToken = fcmTokenRef.current || localStorage.getItem(FCM_CACHE_KEY);
    if (cachedToken) {
      try {
        await <apiService className="removeDoctorFcmToken"></apiService>(cachedToken); // add this endpoint
        console.log("[FCM] Old token removed from backend DB.");
      } catch (err) {
        console.error("[FCM] Failed to remove token from backend:", err);
      }
    }

    // 2️⃣ Delete from Firebase and wipe local cache
    if (messagingRef.current && fcmTokenRef.current) {
      try {
        await deleteToken(messagingRef.current);
        console.log("[FCM] Token deleted from Firebase.");
      } catch (err) {
        console.error("[FCM] Firebase token deletion failed:", err);
      }
    }

    localStorage.removeItem(FCM_CACHE_KEY); // ensures next registerFcm() gets a fresh token
    messagingRef.current = null;
    fcmTokenRef.current = null;
  }

  fcmRegisteredRef.current = false;
}, []);

  useEffect(() => {
    // ✅ No eager registerFcm() on mount
    // Layout waits for dashboard to dispatch real status from profile API
    // This prevents the race: layout saves token → dashboard gets 'offline' → wipes it

    const handleStatusChange = (e: Event) => {
      const { status } = (e as CustomEvent<{ status: 'online' | 'offline' }>).detail;
      console.log("[Layout] Received doctor-status-changed:", status);
      if (status === 'online') {
        registerFcm();
      } else {
        unregisterFcm(true);
      }
    };

    const handleLogout = () => {
      console.log("[Layout] Received doctor-logged-out");
      unregisterFcm(true);
    };

    window.addEventListener('doctor-status-changed', handleStatusChange);
    window.addEventListener('doctor-logged-out', handleLogout);

    return () => {
      window.removeEventListener('doctor-status-changed', handleStatusChange);
      window.removeEventListener('doctor-logged-out', handleLogout);
    };
  }, [registerFcm, unregisterFcm]);

  return (
    <>
      {children}
      <div className="fixed bottom-0 left-0 right-0 z-999 pointer-events-none">
        <div className="pointer-events-auto">
          <GlobalCallSidebar />
        </div>
      </div>
    </>
  );
}