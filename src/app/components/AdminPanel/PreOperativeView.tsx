'use client';

import { useMemo, useState } from 'react';
import { createCajaAdministrativa } from '@/services/cajaService';
import { useOwnerOperations } from '@/app/components/AdminPanel/OwnerOperationsContext';

type ParkingOption = {
  _id: string;
  name: string;
};

type Props = {
  selectedParkingId: string;
  parkingName?: string;
  parkingOptions?: ParkingOption[];
  onParkingChange?: (value: string) => void;
  parkingSelectorDisabled?: boolean;
  onOpened?: () => Promise<void> | void;
};

export default function PreOperativeView({ selectedParkingId, parkingName, parkingOptions = [], onParkingChange, parkingSelectorDisabled = false, onOpened }: Props) {
  const ctx = useOwnerOperations();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canOpen = useMemo(() => String(selectedParkingId || '').trim().length > 0, [selectedParkingId]);

  const handleOpen = async () => {
    if (!canOpen) {
      setError('Seleccioná una playa para iniciar la operación.');
      return;
    }

    try {
      setOpening(true);
      setError(null);
      ctx?.setStatusMessage?.(null);
      await createCajaAdministrativa({ parkinglotId: selectedParkingId });
      ctx?.setStatusMessage?.({ type: 'success', text: 'Operación iniciada. Caja/turno administrativo abierto correctamente.' });
      ctx?.setOperationalState?.('operativo');
      ctx?.bumpRefreshToken?.();
      await onOpened?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar la operación.';
      setError(message);
      ctx?.setStatusMessage?.({ type: 'error', text: message });
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-amber-950">Iniciar turno</h3>
          <p>
            Seleccioná la playa y comenzá la jornada.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-amber-950">Playa</label>
          <select
            value={selectedParkingId}
            onChange={(e) => onParkingChange?.(e.target.value)}
            disabled={parkingSelectorDisabled || opening}
            className="w-full rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Seleccionar playa</option>
            {parkingOptions.map((parking) => (
              <option key={parking._id} value={parking._id}>{parking.name}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-amber-900">
            Playa seleccionada: <strong>{parkingName || 'Sin selección'}</strong>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void handleOpen()}
          disabled={opening || !canOpen}
          className="rounded-xl border border-emerald-300 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {opening ? 'Iniciando turno...' : 'Iniciar turno'}
        </button>
        <div className="rounded-xl border border-amber-300 bg-white/70 px-4 py-2.5 text-xs text-amber-900">
          Al iniciar turno se habilita el entorno operativo de la jornada.
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
