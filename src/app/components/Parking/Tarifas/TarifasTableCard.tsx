'use client';

import React, { useEffect, useState } from 'react';
import { useTarifas } from '@/app/hooks/Parking/useTarifas';
import type { Tarifa } from '@/interfaces/tarifa';
import { Pencil, Trash, Tag } from 'lucide-react';
import Tooltip from '@/app/components/Tooltip'; // Componente Tooltip genérico, simple

interface TarifasTableCardProps {
  onEdit: (tarifa: Tarifa) => void;
}

export default function TarifasTableCard({ onEdit }: TarifasTableCardProps) {
  const { tarifas = [], loading, error, deleteTarifa, fetchTarifas } = useTarifas();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    fetchTarifas();
  }, [fetchTarifas]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar esta tarifa?');
    if (!confirmDelete) return;

    setLocalError(null);
    setDeletingId(id);
    try {
      const ok = await deleteTarifa(id);
      if (ok) await fetchTarifas();
      else setLocalError('Error al eliminar la tarifa.');
    } catch {
      setLocalError('Error inesperado al eliminar la tarifa.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className="text-center text-gray-500 py-4">Cargando tarifas...</p>;
  if (error || localError)
    return (
      <p className="text-center text-red-600 font-semibold py-4">{error || localError}</p>
    );
  if (!tarifas.length) return <p className="text-center text-gray-600 py-4">No hay tarifas registradas.</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Tarifas Registradas</h2>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-300 text-gray-800 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">Categoría</th>
              <th className="border px-3 py-2 text-center">Tarifa por Hora</th>
              <th className="border px-3 py-2 text-center">Cantidad de Horas</th>
              <th className="border px-3 py-2 text-left">Tarifas por Día</th>
              <th className="border px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarifas.map((t) => {
              const highRate = t.tarifaHora > 500; // Ejemplo: resaltar tarifas altas
              return (
                <tr
                  key={t._id}
                  className="odd:bg-white even:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                >
                  <td className="border px-2 py-1 capitalize">{t.category}</td>

                  <td
                    className={`border px-2 py-1 text-center font-semibold ${
                      highRate ? 'text-red-600' : 'text-green-700'
                    }`}
                  >
                    ${t.tarifaHora.toFixed(2)}
                  </td>

                  <td className="border px-2 py-1 text-center">{t.cantidadHoras ?? '-'}</td>

                  <td className="border px-2 py-1 text-sm max-w-xs break-words">
                    {t.tarifasPorDia?.length ? (
                      <Tooltip
                        content={
                          <div className="text-left">
                            {t.tarifasPorDia.map((d) => (
                              <p key={d.day} className="mb-1">
                                Día {d.day}: ${d.price.toFixed(2)}{' '}
                                {d.discountPercent ? (
                                  <span className="bg-purple-100 text-purple-800 px-1 rounded text-xs">
                                    -{d.discountPercent}%
                                  </span>
                                ) : null}
                              </p>
                            ))}
                          </div>
                        }
                      >
                        <span className="flex items-center gap-1">
                          {t.tarifasPorDia.map((d) => (
                            <span key={d.day} className="text-xs font-medium bg-gray-200 px-1 rounded">
                              D{d.day}
                              {d.discountPercent ? <Tag size={12} className="inline-block" /> : null}
                            </span>
                          ))}
                        </span>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td className="border px-2 py-1 text-center flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(t)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1"
                      aria-label={`Editar tarifa ${t.category}`}
                    >
                      <Pencil size={16} /> Editar
                    </button>
                    <button
                      onClick={() => t._id && handleDelete(t._id)}
                      disabled={deletingId === t._id}
                      className={`px-3 py-1 rounded text-white flex items-center gap-1 ${
                        deletingId === t._id
                          ? 'bg-gray-400 cursor-wait'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      aria-label={`Eliminar tarifa ${t.category}`}
                    >
                      <Trash size={16} /> {deletingId === t._id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
