'use client';

import React, { useEffect, useState } from 'react';
import { createCajaAdministrativa, getCajaActual } from '@/services/cajaService';
import { saveCajaState } from '@/store/caja/actions';

export default function OpenTurnoWidget() {
  const [parkings, setParkings] = useState<Array<any>>([]);
  const [parkingId, setParkingId] = useState<string>('');
  const [cajaNumero, setCajaNumero] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v2/billing/parkings');
        const data = await res.json();
        if (Array.isArray(data)) { setParkings(data); if (!parkingId && data.length>0) { const pid = String(data[0]._id); setParkingId(pid); const digits = pid.replace(/\D/g,''); setCajaNumero(digits ? digits.slice(-5) : ''); } }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Auto-fill cajaNumero when parkingId or parkings change (covers initial selection)
  useEffect(() => {
    try {
      if (parkingId && (!cajaNumero || String(cajaNumero) === '')) {
        const digits = String(parkingId).replace(/\D/g,'');
        setCajaNumero(digits ? digits.slice(-5) : '');
      }
    } catch (e) {
      // ignore
    }
  }, [parkingId, parkings]);

  const handleOpen = async () => {
    if (!parkingId) return setError('Seleccioná una playa');
    setLoading(true); setError(null); setMessage(null);
    try {
      const turno = await createCajaAdministrativa({ parkinglotId: parkingId, cajaNumero: cajaNumero ? Number(cajaNumero) : undefined });
      if (turno && turno._id) {
        const cajaNum = Number((turno.numeroCaja ?? turno.cajaNumero ?? cajaNumero) || 0);
        const turnoNumero = cajaNum * 1000 + 1;
        saveCajaState({ turnoId: String(turno._id), parkinglotId: parkingId, cajaNumero: cajaNum, turnoNumero, openedAt: new Date().toISOString() });
        // update local state so UI stays in sync
        setCajaNumero(cajaNum);
        setParkingId(String(parkingId));
        // notify other components that caja state changed
        try { window?.dispatchEvent(new CustomEvent('cajaStateChanged')); } catch(e){}
        setMessage('Turno abierto correctamente.');
      } else {
        setError('No se pudo abrir el turno.');
      }
    } catch (e: any) {
      setError(e?.message || 'Error al abrir turno');
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 space-y-4">
      <h3 className="text-lg font-bold">Abrir turno</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <select value={parkingId} onChange={(e) => { const v = e.target.value; setParkingId(v); if (v) { const digits = String(v).replace(/\D/g,''); setCajaNumero(digits ? digits.slice(-5) : ''); } else { setCajaNumero(''); } }} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          <option value="">Seleccionar playa</option>
          {parkings.map((p: any) => <option key={String(p._id)} value={String(p._id)}>{p.name}</option>)}
        </select>
        <input type="number" min={1} value={cajaNumero as any} onChange={(e) => setCajaNumero(e.target.value ? Number(e.target.value) : '')} placeholder="Nº de caja (opcional)" className="rounded-xl border border-gray-300 px-4 py-3" />
        <div />
      </div>

      <div className="flex gap-3">
        <button onClick={handleOpen} disabled={loading || !parkingId} className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Abriendo...' : 'ABRIR TURNO'}</button>
        <button onClick={async () => { if (!parkingId) return setError('Seleccioná una playa'); try { const caja = await getCajaActual(parkingId); if (caja && caja._id) setMessage('Ya existe un turno abierto para esta playa.'); else setMessage('No hay turno abierto'); } catch(e:any){ setError(e?.message||'Error'); } }} className="rounded-xl border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">Verificar turno</button>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
