"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

export type CallStatus =
  | 'waiting'
  | 'pending'
  | 'accepted'
  | 'declined_by_patient'
  | 'declined_by_doctor'
  | 'doctor_not_responding'
  | 'completed';

export interface CallPayload {
  vitalsId: string;
  title: string;
  body: string;
  callUrl: string;
  token?: string;
  patientId?: string;
  patientToken?: string;
  symptoms?: string;
  status?: CallStatus;
}

interface CallQueueContextType {
  onlineQueue: CallPayload[];
  activeCall: CallPayload | null;
  addCall: (call: CallPayload) => void;
  removeCall: (vitalsId: string) => void;
  updateCallStatus: (vitalsId: string, status: CallStatus) => void;
  setActiveCall: (call: CallPayload | null) => void;
}

const CallQueueContext = createContext<CallQueueContextType | null>(null);

export function CallQueueProvider({ children }: { children: ReactNode }) {
  const [onlineQueue, setOnlineQueue] = useState<CallPayload[]>([]);
  const [activeCall, setActiveCall] = useState<CallPayload | null>(null);

  const addCall = (call: CallPayload) => {
    const newCall: CallPayload = { ...call, status: call.status ?? 'waiting' };
    setOnlineQueue(prev =>
      prev.find(c => c.vitalsId === newCall.vitalsId) ? prev : [...prev, newCall]
    );
    setActiveCall(newCall);
  };

  const removeCall = (vitalsId: string) => {
    setOnlineQueue(prev => prev.filter(c => c.vitalsId !== vitalsId));
    setActiveCall(prev => (prev?.vitalsId === vitalsId ? null : prev));
  };

  const updateCallStatus = (vitalsId: string, status: CallStatus) => {
    setOnlineQueue(prev =>
      prev.map(c => (c.vitalsId === vitalsId ? { ...c, status } : c))
    );
    setActiveCall(prev =>
      prev?.vitalsId === vitalsId ? { ...prev, status } : prev
    );
  };

  return (
    <CallQueueContext.Provider
      value={{
        onlineQueue,
        activeCall,
        addCall,
        removeCall,
        updateCallStatus,
        setActiveCall,
      }}
    >
      {children}
    </CallQueueContext.Provider>
  );
}

export function useCallQueue() {
  const ctx = useContext(CallQueueContext);
  if (!ctx) throw new Error('useCallQueue must be used within CallQueueProvider');
  return ctx;
}