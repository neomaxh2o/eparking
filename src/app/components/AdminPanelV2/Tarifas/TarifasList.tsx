'use client';
import React, { useState, useMemo } from 'react';
import { Categoria, TipoEstadia, TarifaHora, TarifaDia, TarifaMensual, TarifaLibre } from '@/interfaces/Tarifa/tarifa';
import type { Tarifa } from '@/interfaces/tarifa';
import { Parking } from '@/interfaces/parking';
import TablaTarifasUI from './TablaTarifasUI';

export type SubTarifaExtendida =
  | (TarifaHora & { parentId: string; category: Categoria; parkinglotId: string })
  | (TarifaDia & { parentId: string; category: Categoria; parkinglotId: string })
  | (TarifaMensual & { parentId: string; category: Categoria; parkinglotId: string })
  | (TarifaLibre & { parentId: string; category: Categoria; parkinglotId: string });

export interface TarifasListProps {
  tarifas: Tarifa[];
  parkings?: Parking[];
  userRole: 'operator' | 'client' | 'owner' | 'admin' | 'guest';
  onSelectTarifa: (tarifa: SubTarifaExtendida) => void;
  onReservar: (tarifa: SubTarifaExtendida) => void;
  onEliminar?: (tarifa: SubTarifaExtendida) => void;
}

export function TarifasList({ tarifas, parkings, userRole, onSelectTarifa, onReservar, onEliminar }: TarifasListProps) {
  const [playaSeleccionadaId, setPlayaSeleccionadaId] = useState<string>('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');

  const tarifasFiltradas: SubTarifaExtendida[] = useMemo(() => {
    const aplanadas: SubTarifaExtendida[] = tarifas.flatMap(t => [
      ...(t.tarifasHora ?? []).map(h => ({ ...h, parentId: t._id.toString(), category: t.category, parkinglotId: t.parkinglotId })),
      ...(t.tarifasPorDia ?? []).map(d => ({ ...d, parentId: t._id.toString(), category: t.category, parkinglotId: t.parkinglotId })),
      ...(t.tarifaMensual ?? []).map(m => ({ ...m, parentId: t._id.toString(), category: t.category, parkinglotId: t.parkinglotId })),
      ...(t.tarifaLibre ?? []).map(l => ({ ...l, parentId: t._id.toString(), category: t.category, parkinglotId: t.parkinglotId })),
    ]);

    return aplanadas.filter(t => {
      const playaMatch = !playaSeleccionadaId || t.parkinglotId === playaSeleccionadaId;
      const categoriaMatch = !categoriaSeleccionada || t.category === categoriaSeleccionada;
      return playaMatch && categoriaMatch;
    });
  }, [tarifas, playaSeleccionadaId, categoriaSeleccionada]);

  const tipos: TipoEstadia[] = ['hora', 'dia', 'mensual', 'libre'];

  return (
    <div className="space-y-6">
      {userRole === 'owner' && parkings?.length ? (
        <div className="dashboard-section p-4 md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="playa-select" className="mb-2 block text-sm font-semibold text-gray-700">Seleccioná una playa</label>
              <select
                id="playa-select"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                value={playaSeleccionadaId}
                onChange={e => setPlayaSeleccionadaId(e.target.value)}
              >
                <option value="">-- Todas las playas --</option>
                {parkings.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="categoria-select" className="mb-2 block text-sm font-semibold text-gray-700">Seleccioná categoría</label>
              <select
                id="categoria-select"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                value={categoriaSeleccionada}
                onChange={e => setCategoriaSeleccionada(e.target.value)}
              >
                <option value="">-- Todas las categorías --</option>
                <option value="Automóvil">Automóvil</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Bicicleta">Bicicleta</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {tipos.map(tipo => {
        const tarifasTipo = tarifasFiltradas.filter(t => t.tipoEstadia === tipo);
        if (!tarifasTipo.length) return null;

        return (
          <TablaTarifasUI
            key={tipo}
            tipoEstadia={tipo}
            tarifas={tarifasTipo}
            userRole={userRole}
            onSelectTarifa={onSelectTarifa}
            onReservar={onReservar}
            onEditar={onSelectTarifa}
            onEliminar={onEliminar}
          />
        );
      })}
    </div>
  );
}
