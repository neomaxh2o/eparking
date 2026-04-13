import React from 'react';

interface MensajeDeEstadoProps {
  successMsg: string | null;
  error: string | null;
}

export default function MensajeDeEstado({ successMsg, error }: MensajeDeEstadoProps) {
  if (successMsg) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
        {successMsg}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return null;
}
