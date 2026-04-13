'use client';
import React, { useState } from 'react';

export default function QuickTicketModal({ open, onClose }: any) {
  const [amount, setAmount] = useState('');
  const [patente, setPatente] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h3 className="text-lg font-bold">Ticket rápido</h3>
        <div className="mt-4 space-y-3">
          <input value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="Patente" className="w-full rounded border px-3 py-2" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto" type="number" className="w-full rounded border px-3 py-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onClose()} className="rounded bg-gray-200 px-4 py-2">Cancelar</button>
          <button onClick={async () => {
            try {
              await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ total: Number(amount), patente }) });
              onClose(true);
            } catch (e) { onClose(false); }
          }} className="rounded bg-emerald-500 px-4 py-2 text-white">Crear</button>
        </div>
      </div>
    </div>
  );
}
