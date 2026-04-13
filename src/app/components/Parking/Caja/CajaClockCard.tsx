'use client';

import React, { useEffect, useMemo, useState } from 'react';

function formatFecha(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatHora(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function CajaClockCard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const fecha = useMemo(() => formatFecha(now), [now]);
  const hora = useMemo(() => formatHora(now), [now]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-5 py-4 text-white shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Caja operativa
          </p>
          <p className="mt-2 text-3xl font-bold leading-none">{hora}</p>
          <p className="mt-2 text-sm text-gray-300 capitalize">{fecha}</p>
        </div>

        <div className="rounded-full bg-green-500/20 px-3 py-1 text-[11px] font-semibold text-green-300">
          En línea
        </div>
      </div>
    </div>
  );
}
