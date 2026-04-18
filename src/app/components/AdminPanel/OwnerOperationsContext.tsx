'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type StatusMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type OperationalState = 'pre-operativo' | 'operativo' | 'post-cierre';

type OperationalSnapshot = {
  activeParkingId: string;
  activeCajaNumero: string;
  activeTurnoId: string;
  turnoEstado: string;
  operationalState: OperationalState;
  resolved: boolean;
};

type OwnerOperationsContextValue = {
  selectedParkingId: string;
  setSelectedParkingId: (value: string) => void;
  refreshToken: number;
  bumpRefreshToken: () => void;
  operationalSnapshot: OperationalSnapshot;
  setOperationalSnapshot: (value: OperationalSnapshot) => void;
  operationalState: OperationalState;
  setOperationalState: (value: OperationalState) => void;
  statusMessage: StatusMessage | null;
  setStatusMessage: (value: StatusMessage | null) => void;
};

const OwnerOperationsContext = createContext<OwnerOperationsContextValue | null>(null);

const INITIAL_SNAPSHOT: OperationalSnapshot = {
  activeParkingId: '',
  activeCajaNumero: '',
  activeTurnoId: '',
  turnoEstado: '',
  operationalState: 'pre-operativo',
  resolved: false,
};

export function OwnerOperationsProvider({ children }: { children: React.ReactNode }) {
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [operationalSnapshot, setOperationalSnapshot] = useState<OperationalSnapshot>(INITIAL_SNAPSHOT);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const bumpRefreshToken = () => setRefreshToken((prev) => prev + 1);
  const setOperationalState = (value: OperationalState) => setOperationalSnapshot((prev) => ({ ...prev, operationalState: value, resolved: true }));
  const value = useMemo(() => ({ selectedParkingId, setSelectedParkingId, refreshToken, bumpRefreshToken, operationalSnapshot, setOperationalSnapshot, operationalState: operationalSnapshot.operationalState, setOperationalState, statusMessage, setStatusMessage }), [selectedParkingId, refreshToken, operationalSnapshot, statusMessage]);
  return <OwnerOperationsContext.Provider value={value}>{children}</OwnerOperationsContext.Provider>;
}

export function useOwnerOperations() {
  return useContext(OwnerOperationsContext);
}
