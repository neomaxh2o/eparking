'use client';

import { useState } from 'react';
import { useTarifaVNext } from '@/modules/pricing/hooks/useTarifaVNext';

export default function PricingQuoteVNext() {
  const [parkinglotId, setParkinglotId] = useState('');
  const { data, loading, error } = useTarifaVNext(parkinglotId || undefined);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Pricing Catalog vNext</h1>

      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="ParkingLot ID (opcional)"
        value={parkinglotId}
        onChange={(e) => setParkinglotId(e.target.value)}
      />

      {loading && <div>Cargando tarifas...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}

      {data && (
        <div className="space-y-4">
          {!data.categories.length ? (
            <div className="rounded border p-3">No hay tarifas disponibles.</div>
          ) : (
            data.categories.map((category) => (
              <div key={category.tarifaId} className="rounded border p-3 space-y-2">
                <div><strong>Categoría:</strong> {category.category}</div>
                <div><strong>Tarifa ID:</strong> {category.tarifaId}</div>
                <div><strong>ParkingLot ID:</strong> {category.parkinglotId}</div>
                <ul className="list-disc pl-5">
                  {category.options.map((option, index) => (
                    <li key={`${category.tarifaId}-${index}`}>
                      {option.tipoEstadia} · cantidad {option.cantidad} · unitario {option.precioUnitario} · total {option.precioTotal}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
