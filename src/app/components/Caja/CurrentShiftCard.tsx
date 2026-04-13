'use client';
import React from 'react';

export default function CurrentShiftCard({ shift, onOpenQuickTicket }: any) {
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Turno actual</p>
      {shift ? (
        <div className="mt-2">
          <p className="font-bold">ID: {String(shift._id).slice(-6)}</p>
          <p>Estado: {shift.status}</p>
          <p>Tickets: {shift.ticketsCount ?? 0}</p>
          <div className="mt-2">
            <button onClick={() => onOpenQuickTicket()} className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-semibold text-indigo-700">Ticket rápido</button>
          </div>
        </div>
      ) : (
        <div className="mt-2">No hay turno abierto</div>
      )}
    </div>
  );
}
