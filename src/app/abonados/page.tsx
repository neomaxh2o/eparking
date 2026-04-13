'use client';

import { useSession } from 'next-auth/react';
import UserPanel from '@/app/components/UserPanel/UserPanel';

export default function AbonadosPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-100 py-10 px-6">Cargando panel...</div>;
  }

  if (!session?.user) {
    return <div className="min-h-screen bg-gray-100 py-10 px-6">Debes iniciar sesión para acceder al panel.</div>;
  }

  if (session.user.role !== 'client') {
    return <div className="min-h-screen bg-gray-100 py-10 px-6">Este panel es solo para clientes autenticados.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <UserPanel />
    </div>
  );
}
