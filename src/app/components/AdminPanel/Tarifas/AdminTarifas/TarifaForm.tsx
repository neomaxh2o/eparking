'use client';
import React from 'react';

interface TarifaFormProps<T> {
  mode: 'hora' | 'dia' | 'mensual' | 'libre';
  tarifas: T[];
  setTarifas: React.Dispatch<React.SetStateAction<T[]>>;
  habilitar: boolean;
  applyDiscountToAll?: boolean;
  setApplyDiscountToAll?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TarifaForm<
  T extends { cantidad?: number; precioUnitario: number; bonificacionPorc?: number; precioConDescuento?: number; precioTotal?: number }
>({
  mode,
  tarifas,
  setTarifas,
  habilitar,
  applyDiscountToAll = false,
  setApplyDiscountToAll,
}: TarifaFormProps<T>) {
  const agregarFila = () => {
    const nextCantidad = mode !== 'libre' ? (tarifas.length > 0 ? (tarifas[tarifas.length - 1].cantidad ?? 0) + 1 : 1) : undefined;

    setTarifas(prev => [
      ...prev,
      {
        cantidad: nextCantidad,
        precioUnitario: 0,
        bonificacionPorc: 0,
        precioConDescuento: 0,
        precioTotal: 0,
      } as T,
    ]);
  };

  const handleChange = (index: number, field: keyof T, value: string) => {
    const updated = [...tarifas];
    const val = value === '' ? 0 : Number(value);
    updated[index] = { ...updated[index], [field]: val } as T;

    const descuento = (updated[index].bonificacionPorc ?? 0) as number;
    const precioUnitario = (updated[index].precioUnitario ?? 0) as number;
    const cantidad = (updated[index].cantidad ?? 1) as number;

    updated[index].precioConDescuento = precioUnitario * (1 - descuento / 100);
    updated[index].precioTotal = (updated[index].precioConDescuento ?? 0) * cantidad;

    if (applyDiscountToAll && field === 'bonificacionPorc' && setApplyDiscountToAll) {
      updated.forEach(item => {
        item.bonificacionPorc = val;
        item.precioConDescuento = (item.precioUnitario ?? 0) * (1 - val / 100);
        item.precioTotal = (item.precioConDescuento ?? 0) * (item.cantidad ?? 1);
      });
    }

    setTarifas(updated);
  };

  const eliminarFila = (index: number) => {
    if (tarifas.length <= 1) return;
    setTarifas(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Tarifas {mode === 'hora' ? 'por Hora' : mode === 'dia' ? 'por Día' : mode === 'mensual' ? 'Mensuales' : 'Libre'}
      </h3>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full border-collapse text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-100 text-left">
              {mode !== 'libre' && <th className="border-b border-gray-200 px-4 py-3">{mode === 'hora' ? 'Horas' : 'Días / Mes'}</th>}
              <th className="border-b border-gray-200 px-4 py-3">Precio Unitario ($)</th>
              <th className="border-b border-gray-200 px-4 py-3">Bonificación %</th>
              <th className="border-b border-gray-200 px-4 py-3">Precio con Descuento</th>
              <th className="border-b border-gray-200 px-4 py-3">Total</th>
              <th className="border-b border-gray-200 px-4 py-3">Acción</th>
            </tr>
          </thead>

          <tbody>
            {tarifas.map((t, i) => (
              <tr key={i} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                {mode !== 'libre' && (
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={t.cantidad ?? 1}
                      disabled
                      className="w-20 rounded-xl border border-gray-200 bg-gray-100 px-2 py-2 text-center text-sm text-gray-600"
                    />
                  </td>
                )}

                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min={0}
                    value={t.precioUnitario ?? 0}
                    onChange={e => handleChange(i, 'precioUnitario' as keyof T, e.target.value)}
                    disabled={!habilitar}
                    className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-gray-500"
                  />
                </td>

                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={t.bonificacionPorc ?? 0}
                    onChange={e => handleChange(i, 'bonificacionPorc' as keyof T, e.target.value)}
                    disabled={!habilitar}
                    className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-gray-500"
                  />
                </td>

                <td className="px-4 py-3 text-right font-semibold">${(t.precioConDescuento ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold">${(t.precioTotal ?? 0).toFixed(2)}</td>

                <td className="px-4 py-3 text-center">
                  {habilitar ? (
                    <button onClick={() => eliminarFila(i)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100">
                      Eliminar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {habilitar ? (
        <button onClick={agregarFila} className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">
          + Agregar fila
        </button>
      ) : null}
    </div>
  );
}
