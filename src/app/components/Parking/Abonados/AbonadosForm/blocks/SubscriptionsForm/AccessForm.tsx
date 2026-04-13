'use client';

import React, { useMemo } from 'react';
import { MedioAcceso, TipoPago } from '@/interfaces/user';
import { ISubscription } from '@/interfaces/Abono/subscription';
import { SubTarifa } from '@/interfaces/Tarifa/tarifa';
import { useSubscriptionContext } from '@/app/context/SubscriptionContext';

interface AccessFormProps {
  form: Partial<ISubscription>;
  tiposPago: TipoPago[];
  onChange: (partial: Partial<ISubscription>) => void;
}

export const AccessForm: React.FC<AccessFormProps> = ({ form, tiposPago, onChange }) => {
  const { tarifas } = useSubscriptionContext();
  const mediosAcceso: MedioAcceso[] = ['ticket', 'tarjeta-rfid', 'llavero-rfid'];

  // --- Categorías únicas disponibles ---
  const categoriasDisponibles = useMemo(() => {
    const cats = tarifas.map(t => t.category);
    return Array.from(new Set(cats));
  }, [tarifas]);

  // --- Filtrar tarifas mensuales según categoría ---
  const tarifasMensuales: SubTarifa[] = useMemo(() => {
    if (!form.categoriaVehiculo) return [];
    const tarifasCat = tarifas.filter(t => t.category === form.categoriaVehiculo);
    const subTarifas: SubTarifa[] = [];
    tarifasCat.forEach(t => {
      if (t.tarifaMensual) {
        subTarifas.push(
          ...t.tarifaMensual.map(m => ({
            ...m,
            category: t.category,
            _id: t._id,
          }))
        );
      }
    });
    return subTarifas;
  }, [form.categoriaVehiculo, tarifas]);

  // --- Formatear fechas para datetime-local ---
  const formatForInput = (date?: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // --- Manejar cambios de fecha convertidos a Date ---
  const handleDateChange = (field: 'fechaAlta' | 'vigenciaHasta', value: string) => {
    onChange({ ...form, [field]: new Date(value) });
  };

  // --- Calcular monto a cobrar ---
  const montoACobrar = useMemo(() => {
    const tarifa = tarifasMensuales.find(t => t.tipoEstadia === form.tipoTarifa);
    if (!tarifa) return 0;
    const cantidad = 'cantidad' in tarifa ? tarifa.cantidad || 1 : 1;
    return tarifa.precioUnitario * cantidad;
  }, [form.tipoTarifa, tarifasMensuales]);

  return (
    <div className="mb-6 border p-4 rounded bg-gray-50">
      <h4 className="font-semibold mb-2">Acceso y Tarifa</h4>

      {/* Medio de Acceso + ID Medio de Acceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Medio de Acceso</label>
          <select
            value={form.medioAcceso || 'ticket'}
            onChange={e => onChange({ ...form, medioAcceso: e.target.value as MedioAcceso })}
            className="border p-2 rounded w-full"
          >
            {mediosAcceso.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID Medio de Acceso</label>
          <input
            type="text"
            value={form.idMedioAcceso || ''}
            onChange={e => onChange({ ...form, idMedioAcceso: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Ingrese ID"
          />
        </div>
      </div>

      {/* Categoría del Vehículo + Tipo de Tarifa Mensual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Categoría del Vehículo</label>
          <select
            value={form.categoriaVehiculo || ''}
            onChange={e => onChange({ ...form, categoriaVehiculo: e.target.value, tipoTarifa: '' })}
            className="border p-2 rounded w-full"
          >
            <option value="" disabled>Selecciona una categoría</option>
            {categoriasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Tarifa Mensual</label>
          <select
            value={form.tipoTarifa || ''}
            onChange={e => onChange({ ...form, tipoTarifa: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="" disabled>Selecciona una tarifa</option>
            {tarifasMensuales.map(t => {
              const key = `${t._id}-${t.tipoEstadia}-${t.precioTotal}-${'cantidad' in t ? t.cantidad : 1}`;
              return <option key={key} value={t.tipoEstadia}>{`${t.tipoEstadia} - $${t.precioTotal}`}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Fechas */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de Inicio</label>
          <input
            type="datetime-local"
            value={formatForInput(form.fechaAlta)}
            onChange={e => handleDateChange('fechaAlta', e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vigencia Hasta</label>
          <input
            type="datetime-local"
            value={formatForInput(form.vigenciaHasta)}
            onChange={e => handleDateChange('vigenciaHasta', e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* Nuevos campos: Tipo de Pago, Período de Extensión, Monto a Cobrar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Pago</label>
          <select
            value={form.tipoPago || 'efectivo'}
            onChange={e => onChange({ ...form, tipoPago: e.target.value as TipoPago })}
            className="border p-2 rounded w-full"
          >
            {tiposPago.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Período de Extensión (días)</label>
          <input
            type="number"
            value={form.periodoExtension ?? 0}
            onChange={e => onChange({ ...form, periodoExtension: Number(e.target.value) })}
            className="border p-2 rounded w-full"
            placeholder="Días extra"
          />
        </div>
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
