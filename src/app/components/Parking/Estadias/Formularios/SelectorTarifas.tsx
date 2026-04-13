'use client';
import React, { useState, useEffect } from 'react';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import { Categoria, ITarifa, TipoEstadia, TarifaHora, TarifaDia, TarifaMensual, TarifaLibre, SubTarifa } from '@/interfaces/Tarifa/tarifa';

const categorias: Categoria[] = ['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'];
const tiposTarifa: TipoEstadia[] = ['hora', 'dia', 'mensual', 'libre'];

interface SelectorTarifasProps {
  parkinglotId?: string;
  onSelectTarifa?: (tarifa: SubTarifa | null, fechas?: { entrada: string; salida: string }) => void;
}

export const SelectorTarifas: React.FC<SelectorTarifasProps> = ({ parkinglotId, onSelectTarifa }) => {
  const { tarifas, loading, error, getTarifaByCategory } = useTarifas(parkinglotId);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>(categorias[0]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoEstadia>('hora');
  const [tarifaSeleccionadaIdx, setTarifaSeleccionadaIdx] = useState<number | null>(null);
  const [fechaEntrada, setFechaEntrada] = useState<string>(new Date().toISOString().slice(0, 16));
  const [fechaSalida, setFechaSalida] = useState<string>('');
  const [autoCalcular, setAutoCalcular] = useState<boolean>(true);

  const tarifaActual: ITarifa | null = getTarifaByCategory(categoriaSeleccionada);

  // Helper: convierte cualquier sub-tarifa en SubTarifa completo con _id y category
  const crearSubTarifaCompleta = (sub: TarifaHora | TarifaDia | TarifaMensual | TarifaLibre): SubTarifa => ({
    ...sub,
    _id: tarifaActual!._id,
    category: tarifaActual!.category,
  });

  // Reset al cambiar tipo/categoría
  useEffect(() => {
    setTarifaSeleccionadaIdx(null);
    setFechaEntrada(new Date().toISOString().slice(0, 16));
    setFechaSalida('');
    setAutoCalcular(true);
    onSelectTarifa?.(null);
  }, [categoriaSeleccionada, tipoSeleccionado]);

  // Cálculo automático de fechas y selección
  useEffect(() => {
    if (!tarifaActual || tarifaSeleccionadaIdx === null) {
      onSelectTarifa?.(null);
      return;
    }

    let subTarifa: TarifaHora | TarifaDia | TarifaMensual | TarifaLibre | null = null;
    switch (tipoSeleccionado) {
      case 'hora': subTarifa = tarifaActual.tarifasHora?.[tarifaSeleccionadaIdx] ?? null; break;
      case 'dia': subTarifa = tarifaActual.tarifasPorDia?.[tarifaSeleccionadaIdx] ?? null; break;
      case 'mensual': subTarifa = tarifaActual.tarifaMensual?.[tarifaSeleccionadaIdx] ?? null; break;
      case 'libre': subTarifa = tarifaActual.tarifaLibre?.[tarifaSeleccionadaIdx] ?? null; break;
    }

    if (!subTarifa) {
      onSelectTarifa?.(null);
      return;
    }

    const now = new Date();
    let salida = new Date(now);

    if (autoCalcular) {
      switch (subTarifa.tipoEstadia) {
        case 'hora': salida.setHours(salida.getHours() + subTarifa.cantidad); break;
        case 'dia': salida.setDate(salida.getDate() + subTarifa.cantidad); break;
        case 'mensual': salida.setMonth(salida.getMonth() + subTarifa.cantidad); break;
        case 'libre': salida = now; break;
      }
    } else {
      salida = new Date(fechaSalida);
    }

    const entradaStr = now.toISOString().slice(0, 16);
    const salidaStr = salida.toISOString().slice(0, 16);

    setFechaEntrada(entradaStr);
    setFechaSalida(salidaStr);

    onSelectTarifa?.(crearSubTarifaCompleta(subTarifa), { entrada: entradaStr, salida: salidaStr });
  }, [tarifaSeleccionadaIdx, tarifaActual, autoCalcular, tipoSeleccionado]);

  const handleSelectTarifa = (idx: number) => {
    setTarifaSeleccionadaIdx(tarifaSeleccionadaIdx === idx ? null : idx);
  };

  const renderTarifaCard = (t: SubTarifa, idx: number) => {
    const isSelected = tarifaSeleccionadaIdx === idx;

    let duracion = '';
    if (isSelected && t.tipoEstadia !== 'libre') {
      duracion = `${t.cantidad} ${t.tipoEstadia === 'hora' ? 'hora(s)' : t.tipoEstadia === 'dia' ? 'día(s)' : 'mes(es)'}`;
    }

    return (
      <div
        key={`${tipoSeleccionado}-${idx}`}
        className={`border rounded-lg p-4 shadow-sm cursor-pointer transition hover:shadow-lg mb-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
        onClick={() => handleSelectTarifa(idx)}
      >
        <div className="flex justify-between items-center">
          <div>
            {t.tipoEstadia !== 'libre' && 'cantidad' in t && <p className="font-semibold">{duracion}</p>}
            {t.tipoEstadia === 'libre' && <p className="font-semibold">Libre</p>}
            <p>Unit: ${t.precioUnitario.toFixed(2)}</p>
            <p>Total: ${t.precioTotal.toFixed(2)}</p>
            {t.bonificacionPorc ? <p className="text-green-600">Desc: {t.bonificacionPorc}%</p> : null}
            {isSelected && ['hora','dia','mes'].includes(t.tipoEstadia) && (
              <div className="mt-2 text-sm text-gray-700">
                <p>Entrada: {fechaEntrada}</p>
                <p>Salida: {fechaSalida}</p>
                <p>Duración: {duracion}</p>
              </div>
            )}
          </div>
          <input type="checkbox" checked={isSelected} onChange={() => handleSelectTarifa(idx)} className="w-5 h-5" disabled={tarifaSeleccionadaIdx !== null && !isSelected} />
        </div>
      </div>
    );
  };

  const renderTarifas = () => {
    if (!tarifaActual) return <p>No hay tarifas disponibles para esta categoría.</p>;

    switch (tipoSeleccionado) {
      case 'hora': return tarifaActual.tarifasHora?.length
        ? tarifaActual.tarifasHora.map((t, idx) => renderTarifaCard(crearSubTarifaCompleta(t), idx))
        : <p>No hay tarifas por hora.</p>;
      case 'dia': return tarifaActual.tarifasPorDia?.length
        ? tarifaActual.tarifasPorDia.map((t, idx) => renderTarifaCard(crearSubTarifaCompleta(t), idx))
        : <p>No hay tarifas por día.</p>;
      case 'mensual': return tarifaActual.tarifaMensual?.length
        ? tarifaActual.tarifaMensual.map((t, idx) => renderTarifaCard(crearSubTarifaCompleta(t), idx))
        : <p>No hay tarifas mensuales.</p>;
      case 'libre': return tarifaActual.tarifaLibre?.length
        ? tarifaActual.tarifaLibre.map((t, idx) => renderTarifaCard(crearSubTarifaCompleta(t), idx))
        : <p>No hay tarifas libres.</p>;
    }
  };

  if (loading) return <p>Cargando tarifas...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-4 border rounded-lg shadow-md bg-gray-50">
      <h2 className="text-xl font-bold mb-4">Selector de Tarifas</h2>

      <div className="mb-4 flex gap-4">
        <div>
          <label className="mr-2 font-medium">Categoría:</label>
          <select className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400" value={categoriaSeleccionada} onChange={e => setCategoriaSeleccionada(e.target.value as Categoria)}>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mr-2 font-medium">Tipo de tarifa:</label>
          <select className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-400" value={tipoSeleccionado} onChange={e => setTipoSeleccionado(e.target.value as TipoEstadia)}>
            {tiposTarifa.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {['dia', 'hora', 'mes'].includes(tipoSeleccionado) && tarifaSeleccionadaIdx !== null && (
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoCalcular} onChange={() => setAutoCalcular(!autoCalcular)} />
            <span className="font-medium">Calcular automáticamente desde ahora</span>
          </label>
        </div>
      )}

      {!autoCalcular && ['dia','hora','mes'].includes(tipoSeleccionado) && tarifaSeleccionadaIdx !== null && tarifaActual && (
        <div className="flex gap-4 mb-4">
          <div>
            <label className="font-medium">Fecha y hora de Entrada:</label>
            <input type={tipoSeleccionado === 'dia' ? 'date' : 'datetime-local'} value={fechaEntrada} onChange={(e) => setFechaEntrada(e.target.value)} className="border p-2 rounded-lg" />
          </div>
          <div>
            <label className="font-medium">Fecha y hora de Salida:</label>
            <input type={tipoSeleccionado === 'dia' ? 'date' : 'datetime-local'} value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} className="border p-2 rounded-lg" />
          </div>
        </div>
      )}

      <div className="grid gap-2 max-h-72 overflow-y-auto">
        {renderTarifas()}
      </div>
    </div>
  );
};
