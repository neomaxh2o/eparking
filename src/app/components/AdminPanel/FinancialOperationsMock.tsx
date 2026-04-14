'use client';

import React, { useState, useEffect } from 'react';
import { loadCajaState, clearCajaState } from '@/store/caja/actions';
import { DEBUG_PARKING, closeCaja } from '@/services/cajaService';

export default function FinancialOperationsMock() {
  const [caja, setCaja] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    try { const s = loadCajaState(); setCaja(s); } catch { setCaja(null); }
    const handler = () => { try { setCaja(loadCajaState()); } catch { setCaja(null);} };
    window?.addEventListener('cajaStateChanged', handler);
    return () => { window?.removeEventListener('cajaStateChanged', handler); };
  }, []);

  const handleCharge = async () => {
    if (!caja || !caja.turnoId) return setMessage('No hay caja abierta.');
    try {
      const res = await fetch('/api/v2/billing/test/charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ turnoId: caja.turnoId, amount: 10000, storeId: caja.parkinglotId }), credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Error al registrar cobro');
      if (DEBUG_PARKING) console.debug('[DEBUG_PARKING] real charge result', data);
      setMessage('Cobro real registrado OK (100.00 ARS)');
    } catch (e: any) {
      setMessage('Error registrando cobro: ' + (e?.message || 'desconocido'));
    }
  };

  if (!caja || !caja.turnoId) return null;

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
      <h4 className="font-bold">Módulo de operaciones (prueba)</h4>
      <p className="text-xs text-gray-500">Caja: {caja.cajaNumero ?? '-'} · TurnoId: {caja.turnoId} · TurnoNum: {caja.turnoNumero ?? '-'}</p>
      <div className="mt-3 flex gap-3">
        <button onClick={handleCharge} className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700">Cobrar prueba 100 ARS</button>
        <button onClick={() => { setMessage(null); }} className="rounded-xl border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">Limpiar</button>
        <button onClick={async () => {
          if (!caja || !caja.turnoId) return setMessage('No hay turno abierto.');
          try {
            await closeCaja(caja.turnoId);
            clearCajaState();
            setCaja(null);
            setMessage('Turno cerrado correctamente.');
          } catch (e: any) {
            setMessage('Error cerrando turno: ' + (e?.message || 'desconocido'));
          }
        }} className="rounded-xl border border-red-600 bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700">Cerrar turno</button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
    </div>
  );
}
