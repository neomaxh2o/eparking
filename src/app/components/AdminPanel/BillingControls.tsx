'use client';
import React from 'react';
import { loadCajaState } from '../../../store/caja/actions';

export default function BillingControls({ children }: { children: React.ReactNode }) {
  const caja = typeof window !== 'undefined' ? loadCajaState() : null;
  const isCajaOpen = Boolean(caja && (caja.turnoId || caja.openedAt));
  if (!isCajaOpen) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p>Debes abrir una caja administrativa para la playa seleccionada antes de usar los controles de facturación.</p>
      </div>
    );
  }
  return <>{children}</>;
}
