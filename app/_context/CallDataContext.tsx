// app/_context/CallDataContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CallMetadata {
  patientId: string;
  patientToken: string;
  vitalsId: string;
}

interface CallDataContextType {
  callMetadata: Map<string, CallMetadata>;
  setCallMetadata: (vitalsId: string, data: Omit<CallMetadata, 'vitalsId'>) => void;
  getCallMetadata: (vitalsId: string) => CallMetadata | undefined;
  clearCallMetadata: (vitalsId: string) => void;
  clearAllMetadata: () => void;
}

const CallDataContext = createContext<CallDataContextType | undefined>(undefined);

export function CallDataProvider({ children }: { children: ReactNode }) {
  const [callMetadata, setCallMetadataState] = useState<Map<string, CallMetadata>>(new Map());

  const setCallMetadata = useCallback((vitalsId: string, data: Omit<CallMetadata, 'vitalsId'>) => {
    setCallMetadataState(prev => {
      const newMap = new Map(prev);
      newMap.set(vitalsId, { ...data, vitalsId });
      return newMap;
    });
  }, []);

  const getCallMetadata = useCallback((vitalsId: string) => {
    return callMetadata.get(vitalsId);
  }, [callMetadata]);

  const clearCallMetadata = useCallback((vitalsId: string) => {
    setCallMetadataState(prev => {
      const newMap = new Map(prev);
      newMap.delete(vitalsId);
      return newMap;
    });
  }, []);

  const clearAllMetadata = useCallback(() => {
    setCallMetadataState(new Map());
  }, []);

  return (
    <CallDataContext.Provider value={{
      callMetadata,
      setCallMetadata,
      getCallMetadata,
      clearCallMetadata,
      clearAllMetadata,
    }}>
      {children}
    </CallDataContext.Provider>
  );
}

export function useCallData() {
  const context = useContext(CallDataContext);
  if (context === undefined) {
    throw new Error('useCallData must be used within a CallDataProvider');
  }
  return context;
}