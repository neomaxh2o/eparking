'use client';
import React from 'react';
import { Tarifa } from '@/interfaces/tarifa';
import AccionesTarifa from '@/app/components/AdminPanel/Tarifas/AdminTarifas/AccionesTarifa';

interface TablaTarifasMensualesProps {
  tarifas: Tarifa[];
  userRole: 'operator' | 'client' | 'owner' | 'admin' | 'guest';
  onSelectTarifa?: (tarifa: Tarifa) => void;
  onReservar: (tarifa: Tarifa) => void;
  onEditar?: (tarifa: Tarifa) => void;
  onEliminar?: (tarifa: Tarifa) => void;
  loading?: boolean;
}

export default function TablaTarifasMensuales({
  tarifas,
  userRole,
  onSelectTarifa,
  onReservar,
  onEditar,
  onEliminar,
  loading = false,
}: TablaTarifasMensualesProps) {
  const tarifasMensuales = tarifas.filter((t) => t.tarifaMensual);

  if (tarifasMensuales.length === 0) {
    return <p>No hay tarifas mensuales registradas.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tarifas Mensuales</h2>
      {tarifasMensuales.map((t) => {
        const precioBase = t.tarifaMensual?.price ?? 0;
        const descuento = t.tarifaMensual?.discountPercent ?? 0;
        const precioFinal = t.tarifaMensual?.precioConDescuento ?? precioBase * (1 - descuento / 100);

        return (
          <div key={t._id} className="mb-6 border rounded shadow-sm p-4">
            <h3
              className="text-xl font-semibold mb-2 text-blue-700 cursor-pointer"
              onClick={() => onSelectTarifa && onSelectTarifa(t)}
            >
              {t.category}
            </h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>Precio Base</div>
              <div>Descuento %</div>
              <div>Precio Final</div>
              <div>Acciones</div>

              <div>${precioBase.toFixed(2)}</div>
              <div className="text-center">{descuento}%</div>
              <div className="font-bold text-blue-600">${precioFinal.toFixed(2)}</div>
              <div className="text-center">
                <AccionesTarifa
                  loading={loading}
                  onEditar={userRole === 'owner' ? () => onEditar?.(t) : undefined}
                  onBorrar={userRole === 'owner' ? () => onEliminar?.(t) : undefined}
                  onReservar={userRole !== 'owner' ? () => onReservar(t) : undefined}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
