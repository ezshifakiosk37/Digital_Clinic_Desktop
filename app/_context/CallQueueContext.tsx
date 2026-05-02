"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

export interface CallPayload {
  vitalsId: string;
  title: string;
  body: string;
  callUrl: string;
  token?: string;
  symptoms?: string;
}

interface CallQueueContextType {
  onlineQueue: CallPayload[];
  activeCall: CallPayload | null;
  addCall: (call: CallPayload) => void;
  removeCall: (vitalsId: string) => void;
  setActiveCall: (call: CallPayload | null) => void;
}

const CallQueueContext = createContext<CallQueueContextType | null>(null);

export function CallQueueProvider({ children }: { children: ReactNode }) {
  const [onlineQueue, setOnlineQueue] = useState<CallPayload[]>([]);
  const [activeCall, setActiveCall] = useState<CallPayload | null>(null);

  const addCall = (call: CallPayload) => {
    setOnlineQueue(prev =>
      prev.find(c => c.vitalsId === call.vitalsId) ? prev : [...prev, call]
    );
    setActiveCall(call); // always show toast for latest
  };

  const removeCall = (vitalsId: string) => {
    setOnlineQueue(prev => prev.filter(c => c.vitalsId !== vitalsId));
    setActiveCall(prev => prev?.vitalsId === vitalsId ? null : prev);
  };

  return (
    <CallQueueContext.Provider value={{ onlineQueue, activeCall, addCall, removeCall, setActiveCall }}>
      {children}
    </CallQueueContext.Provider>
  );
}

export function useCallQueue() {
  const ctx = useContext(CallQueueContext);
  if (!ctx) throw new Error('useCallQueue must be used within CallQueueProvider');
  return ctx;
}