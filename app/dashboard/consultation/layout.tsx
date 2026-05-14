// consultation/layout.tsx
"use client";
import { useEffect, useRef, useCallback } from 'react';
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";
import { firebaseApp } from "../../../lib/firebaseClient";
import { AndroidBridge } from '@/app/_utils/AndroidBridges/AndroidBridge';
import { apiService } from '@/app/_utils/apiService';
import { useCallQueue } from '@/app/_context/CallQueueContext';
import GlobalCallSidebar from "./components/GlobalCallSidebar";

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  // ── FCM refs ───────────────────────────────────────────────────────────────
  const messagingRef = useRef<ReturnType<typeof getMessaging> | null>(null);
  const fcmTokenRef = useRef<string | null>(null);
  const fcmListenerRef = useRef<(() => void) | null>(null);
  const fcmRegisteredRef = useRef(false);

  const { addCall } = useCallQueue();

  // ── Build call payload from incoming notification ──────────────────────────
  const buildCallPayload = (payload: any) => {
    const vitalsId = payload?.vitalsId || payload?.data?.vitalsId;
    const patientId = payload?.patientId || payload?.data?.patientId;
    const patientToken = payload?.patientToken || payload?.data?.patientToken || payload?.data?.token;

    console.log("📦 [buildCallPayload] raw payload.data:", payload?.data);
    console.log("📦 [buildCallPayload] token:", payload?.data?.token);

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

  // ── FCM registration ───────────────────────────────────────────────────────
  const registerFcm = useCallback(async () => {
    if (fcmRegisteredRef.current) return;
    const jwt = localStorage.getItem('doc_token');
    if (!jwt) return;

    const saveToken = async (token: string) => {
      fcmTokenRef.current = token;
      try {
        const res = await apiService.saveDoctorFcmToken(token);
        if (res.success) console.log("[FCM] Device registered.");
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
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { console.warn("[FCM] Permission denied."); return; }

        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const messaging = getMessaging(firebaseApp);
        messagingRef.current = messaging;

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });
        if (token) await saveToken(token);

        fcmListenerRef.current = onMessage(messaging, handleIncomingCall);
      } catch (err) {
        console.error("[FCM] Web setup error:", err);
        return;
      }
    }

    fcmRegisteredRef.current = true;
  }, [addCall]);

  // ── FCM unregistration ─────────────────────────────────────────────────────
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
      } catch { }
    } else if (messagingRef.current && fcmTokenRef.current && shouldCleanup) {
      try {
        await deleteToken(messagingRef.current);
        console.log("[FCM] Device unregistered.");
      } catch (err) {
        console.error("[FCM] Token deletion failed:", err);
      }
      messagingRef.current = null;
      fcmTokenRef.current = null;
    }

    fcmRegisteredRef.current = false;
  }, []);

  // ── Listen for status/logout events dispatched by any child page ───────────
  useEffect(() => {
    // Register on mount if a session already exists (e.g. page refresh)
    if (localStorage.getItem('doc_token')) {
      registerFcm();
    }

    // Page dispatches this whenever doctorStatus changes
    const handleStatusChange = (e: Event) => {
      const { status } = (e as CustomEvent<{ status: 'online' | 'offline' }>).detail;
      if (status === 'online') {
        registerFcm();
      } else {
        unregisterFcm(true);
      }
    };

    // Page dispatches this on full logout
    const handleLogout = () => unregisterFcm(true);

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
      {/* GlobalCallSidebar lives here so incoming call notifications work on every page */}
      <div className="fixed bottom-0 left-0 right-0 z-999 pointer-events-none">
        <div className="pointer-events-auto">
          <GlobalCallSidebar />
        </div>
      </div>
    </>
  );
}