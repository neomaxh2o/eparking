'use client';
import React from 'react';
import AccionesTarifa from './AdminTarifas/AccionesTarifa';

interface TablaTarifasUIProps {
  tarifas: any[];
  tipoEstadia: 'hora' | 'dia' | 'mensual' | 'libre';
  userRole: 'operator' | 'client' | 'owner' | 'admin' | 'guest';
  onSelectTarifa?: (tarifa: any) => void;
  onReservar: (tarifa: any) => void;
  onEditar?: (tarifa: any) => void;
  onEliminar?: (tarifa: any) => void;
  loading?: boolean;
}

export default function TablaTarifasUI({
  tarifas,
  tipoEstadia,
  userRole,
  onSelectTarifa,
  onReservar,
  onEditar,
  onEliminar,
  loading = false,
}: TablaTarifasUIProps) {
  if (!tarifas.length) return <p className="text-gray-500 italic">No hay tarifas registradas.</p>;

  const categorias = Array.from(new Set(tarifas.map(t => t.category)));

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Tarifas <span className="text-blue-600 capitalize">{tipoEstadia}</span>
      </h2>

      {categorias.map(categoria => {
        const tarifasDeCategoria = tarifas.filter(t => t.category === categoria);

        return (
          <div key={categoria} className="mb-6 rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3
                className="text-lg font-semibold text-blue-800 cursor-pointer"
                onClick={() => onSelectTarifa?.(tarifasDeCategoria[0])}
              >
                {categoria}
              </h3>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                {tarifasDeCategoria.length} tarifas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-100 text-gray-700 text-left text-sm uppercase">
                  <tr>
                    <th className="px-4 py-2">{tipoEstadia === 'mensual' ? 'Meses' : tipoEstadia === 'dia' ? 'Horas/Día' : 'Horas'}</th>
                    <th className="px-4 py-2 text-right">Precio</th>
                    <th className="px-4 py-2 text-center">Descuento %</th>
                    <th className="px-4 py-2 text-right">Precio Final</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                  {tarifasDeCategoria.map((t, index) => {
                    const cantidad = t.cantidad ?? 1;
                    const precio = t.precioUnitario ?? 0;
                    const descuento = t.bonificacionPorc ?? 0;
                    const precioFinal = precio * (1 - descuento / 100);
                    const total = precioFinal * cantidad;

                    const rowKey = [t.parentId ?? t._id, t.category ?? '', tipoEstadia, t.cantidad ?? 1, t.precioUnitario ?? 0, t.precioTotal ?? 0, index].join(':');

                    return (
                      <tr key={rowKey} className="hover:bg-gray-50 transition cursor-default">
                        <td className="px-4 py-2 text-center font-medium" onClick={() => onSelectTarifa?.(t)}>
                          {cantidad}
                        </td>
                        <td className="px-4 py-2 text-right">${precio.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">{descuento}%</td>
                        <td className="px-4 py-2 text-right font-semibold text-green-600">${precioFinal.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-blue-700">${total.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">
                          <AccionesTarifa
  loading={loading}
  onEditar={userRole === 'owner' ? () => onEditar?.(t) : undefined}
  onBorrar={userRole === 'owner' ? () => onEliminar?.(t) : undefined}
  onReservar={userRole !== 'owner' ? () => onReservar(t) : undefined}
/>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
