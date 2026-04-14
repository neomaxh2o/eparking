'use client';

import { createContext, useContext } from 'react';

type ClientsTabKey = 'users' | 'abonados';

interface ClientsNavigationContextValue {
  goToUsers: () => void;
  goToAbonados: () => void;
}

const ClientsNavigationContext = createContext<ClientsNavigationContextValue | null>(null);

export function ClientsNavigationProvider({
  children,
  goToUsers,
  goToAbonados,
}: {
  children: React.ReactNode;
  goToUsers: () => void;
  goToAbonados: () => void;
}) {
  return (
    <ClientsNavigationContext.Provider value={{ goToUsers, goToAbonados }}>
      {children}
    </ClientsNavigationContext.Provider>
  );
}

export function useClientsNavigation() {
  return useContext(ClientsNavigationContext);
}

export type { ClientsTabKey };
