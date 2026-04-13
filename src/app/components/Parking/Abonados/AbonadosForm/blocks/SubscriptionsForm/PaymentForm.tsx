'use client';

import React, { useMemo } from 'react';
import { TipoPago } from '@/interfaces/user';
import { ISubscription } from '@/interfaces/Abono/subscription';
import { Categoria, SubTarifa, TarifaMensual } from '@/interfaces/Tarifa/tarifa';

export interface PaymentFormState {
  categoriaVehiculo?: Categoria;
  tarifaSeleccionadaId?: string;
}

interface PaymentFormProps {
  form: PaymentFormState & Partial<ISubscription>;
  tiposPago: TipoPago[];
  tarifasDisponibles: SubTarifa[];
  onChange: (partial: PaymentFormState & Partial<ISubscription>) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  form,
  tiposPago,
  tarifasDisponibles,
  onChange,
}) => {
  // Filtrar tarifas según la categoría seleccionada y tipo mensual
  const tarifasFiltradas = useMemo(() => {
    if (!form.categoriaVehiculo) return [];
    return tarifasDisponibles.filter(
      t => t.tipoEstadia === 'mes' && t.category === form.categoriaVehiculo
    );
  }, [form.categoriaVehiculo, tarifasDisponibles]);

  // Derivar tarifaSeleccionada directamente desde form.tarifaSeleccionadaId y tarifasFiltradas
  const tarifaSeleccionada = useMemo(() => {
    return tarifasFiltradas.find(t => t._id === form.tarifaSeleccionadaId);
  }, [form.tarifaSeleccionadaId, tarifasFiltradas]);

  const handleTarifaChange = (tarifaId: string) => {
    onChange({ ...form, tarifaSeleccionadaId: tarifaId });
  };

  const montoACobrar = useMemo(() => {
    if (!tarifaSeleccionada) return 0;
    if ('cantidad' in tarifaSeleccionada) {
      const cantidad = tarifaSeleccionada.cantidad || 1;
      return tarifaSeleccionada.precioUnitario * cantidad;
    }
    return tarifaSeleccionada.precioUnitario || 0;
  }, [tarifaSeleccionada]);

  return (
    <div className="mb-6 border p-4 rounded bg-gray-50">
      <h4 className="font-semibold mb-2">Información de Pago</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de pago */}
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Pago</label>
          <select
            value={form.tipoPago || 'efectivo'}
            onChange={e => onChange({ ...form, tipoPago: e.target.value as TipoPago })}
            className="border p-2 rounded w-full"
          >
            {tiposPago.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría de vehículo */}
        <div>
          <label className="block text-sm font-medium mb-1">Categoría de Vehículo</label>
          <select
            value={form.categoriaVehiculo || ''}
            onChange={e => onChange({ ...form, categoriaVehiculo: e.target.value as Categoria })}
            className="border p-2 rounded w-full"
          >
            <option value="">Seleccione</option>
            {['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'].map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Tarifa mensual */}
        <div>
          <label className="block text-sm font-medium mb-1">Tarifa</label>
          <select
            value={form.tarifaSeleccionadaId || ''}
            onChange={e => handleTarifaChange(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Seleccione</option>
            {tarifasFiltradas
              .filter(
                (t): t is TarifaMensual & { _id: string; category: Categoria } =>
                  t.tipoEstadia === 'mes'
              )
              .map(t => (
                <option key={t._id} value={t._id}>
                  {`$${t.precioUnitario} / ${t.cantidad} mes(es)`}
                </option>
              ))}
          </select>
        </div>

        {/* Período de extensión */}
        <div>
          <label className="block text-sm font-medium mb-1">Periodo de Extensión (días)</label>
          <input
            type="number"
            value={form.periodoExtension ?? 0}
            onChange={e => onChange({ ...form, periodoExtension: Number(e.target.value) })}
            placeholder="Cantidad de días extra de vigencia"
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Monto a cobrar */}
        <div>
          <label className="block text-sm font-medium mb-1">Monto a Cobrar</label>
          <input
            type="text"
            value={`$${montoACobrar.toFixed(2)}`}
            readOnly
            className="border p-2 rounded w-full bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
};
