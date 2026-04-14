import React from 'react';
import TarifasAdminPage from '@/app/components/AdminPanel/Tarifas/TarifasAdminPage';

interface PanelTarifasProps {
  userRole: 'owner' | 'client' | 'guest' | 'operator' | 'admin';
}

export default function PanelTarifas({ userRole }: PanelTarifasProps) {
  return <TarifasAdminPage userRole={userRole} />;
}
