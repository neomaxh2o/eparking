'use client';

import React, { useState, useEffect } from 'react';
import { SelectorTarifas } from './SelectorTarifas';
import { FormContainer } from './FormContainer';
import { SubTarifa, Categoria } from '@/interfaces/Tarifa/tarifa';
import { IEstadia } from '@/interfaces/Estadias/estadias';
import { useTurno } from '@/app/context/TurnoContext';
import { useEstadias } from '@/modules/parking-sessions/hooks/useEstadias';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const categoriasValidas: Categoria[] = ['Automóvil','Camioneta','Bicicleta','Motocicleta','Otros'];

const mapCategory = (cat: string): Categoria => {
  return categoriasValidas.includes(cat as Categoria) ? (cat as Categoria) : 'Otros';
};

const mapEstadiaToSubTarifa = (estadia: IEstadia): SubTarifa => ({
  _id: estadia._id,
  category: mapCategory(estadia.categoria),
  tipoEstadia: estadia.tipoEstadia,
  precioUnitario: estadia.precioUnitario,
  cantidad: estadia.cantidadHoras || estadia.cantidadDias || estadia.cantidadMeses || 0,
  precioTotal: estadia.precioTotal,
  bonificacionPorc: estadia.bonificacionPorc,
  precioConDescuento: estadia.precioConDescuento,
});

export const FormPadre: React.FC = () => {
  const { operator, parkinglotId } = useTurno();
  const { createEstadia, getEstadiaByTicket, loading } = useEstadias();

  const [ticket, setTicket] = useState<string>('');
  const [patente, setPatente] = useState('');
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<SubTarifa | null>(null);
  const [fechas, setFechas] = useState<{ entrada: string; salida: string } | null>(null);

  const [manualMode, setManualMode] = useState(false);
  const [prepago, setPrepago] = useState(false);
  const [montoPago, setMontoPago] = useState<number | undefined>(undefined);
  const [formaPago, setFormaPago] = useState<'Efectivo' | 'Tarjeta' | 'QR'>('Efectivo');

  const generarTicket = () => `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const calcularMonto = () => {
    if (!tarifaSeleccionada || !fechas) return 0;

    const entrada = dayjs.utc(fechas.entrada).tz('America/Argentina/Buenos_Aires');
    const salida = dayjs.utc(fechas.salida).tz('America/Argentina/Buenos_Aires');

    if (tarifaSeleccionada.tipoEstadia === 'libre') return tarifaSeleccionada.precioUnitario;

    const diffMs = salida.diff(entrada);
    let factor = 1;

    switch(tarifaSeleccionada.tipoEstadia) {
      case 'hora': factor = Math.ceil(diffMs / (1000*60*60)); break;
      case 'dia': factor = Math.ceil(diffMs / (1000*60*60*24)); break;
      case 'mensual': factor = Math.ceil(diffMs / (1000*60*60*24*30)); break;
    }

    return tarifaSeleccionada.bonificacionPorc
      ? Math.ceil(factor * tarifaSeleccionada.precioUnitario * (1 - tarifaSeleccionada.bonificacionPorc/100))
      : Math.ceil(factor * tarifaSeleccionada.precioUnitario);
  };

  useEffect(() => {
    if (prepago && tarifaSeleccionada) setMontoPago(calcularMonto());
    else setMontoPago(undefined);
  }, [tarifaSeleccionada, prepago, fechas]);

  const handleBuscarTicket = async () => {
    if (!ticket) return;
    try {
      const estadia = await getEstadiaByTicket(ticket);
      if (!estadia) { alert('Ticket no encontrado'); return; }

      setPatente(estadia.patente);
      setTarifaSeleccionada(mapEstadiaToSubTarifa(estadia));
      setFechas({
        entrada: dayjs.utc(estadia.horaEntrada).tz('America/Argentina/Buenos_Aires').toISOString(),
        salida: dayjs.utc(estadia.horaSalida ?? new Date().toISOString()).tz('America/Argentina/Buenos_Aires').toISOString(),
      });
      setPrepago(!!(estadia.totalCobrado && estadia.totalCobrado > 0));
      setMontoPago(estadia.totalCobrado ?? undefined);
      setFormaPago(
        estadia.metodoPago
          ? (estadia.metodoPago.charAt(0).toUpperCase() + estadia.metodoPago.slice(1)) as 'Efectivo' | 'Tarjeta' | 'QR'
          : 'Efectivo'
      );
      setManualMode(true);
    } catch (err) {
      console.error('Error al buscar ticket:', err);
      alert('Error al buscar ticket');
    }
  };

  const handleSubmit = async () => {
    if (!patente || !tarifaSeleccionada || !operator || !fechas) {
      alert('Debe ingresar la patente, seleccionar una tarifa y tener un operador válido.');
      return;
    }

    const ticketNumber = ticket || generarTicket();

    try {
      const nuevaEstadia = await createEstadia(
        tarifaSeleccionada,
        patente,
        operator._id,
        operator.assignedParkingId,
        dayjs.utc(fechas.entrada).tz('America/Argentina/Buenos_Aires').toISOString(),
        dayjs.utc(fechas.salida).tz('America/Argentina/Buenos_Aires').toISOString(),
        {
          prepago,
          totalCobrado: prepago ? calcularMonto() : 0,
          metodoPago: formaPago.toLowerCase() as 'efectivo' | 'tarjeta' | 'qr',
        }
      );

      alert(`Datos enviados correctamente! Ticket: ${ticketNumber}`);
      setPatente('');
      setTarifaSeleccionada(null);
      setFechas(null);
      setTicket('');
      setManualMode(false);
      setPrepago(false);
      setMontoPago(undefined);
      setFormaPago('Efectivo');

      // 🔹 Plaza asignada ahora viene desde la API
      console.log('Plaza asignada automáticamente:', nuevaEstadia.plazaAsignadaId, nuevaEstadia.subplazaAsignadaNumero);
    } catch (err) {
      console.error('Error al crear estadía:', err);
      alert('Error al enviar los datos.');
    }
  };

  return (
    <FormContainer title="Gestión de Tarifas" className="max-w-4xl p-10">
      <div className="flex flex-col mb-4">
        <label htmlFor="ticket" className="font-medium text-gray-700 mb-2">Buscar Ticket</label>
        <div className="flex space-x-2">
          <input
            id="ticket"
            type="text"
            placeholder="Número de ticket"
            value={ticket}
            onChange={(e) => setTicket(e.target.value.toUpperCase())}
            className="border border-gray-300 rounded-lg p-3 flex-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleBuscarTicket}
            className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="manualMode"
          checked={manualMode}
          onChange={(e) => setManualMode(e.target.checked)}
        />
        <label htmlFor="manualMode" className="ml-2 font-medium text-gray-700">Manual</label>
      </div>

      {manualMode && (
        <>
          <div className="flex flex-col mb-6">
            <label htmlFor="patente" className="font-medium text-gray-700 mb-2">Patente</label>
            <input
              id="patente"
              type="text"
              placeholder="Patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value.toUpperCase())}
              className="border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <SelectorTarifas
            parkinglotId={parkinglotId ?? undefined}
            onSelectTarifa={(tarifa, fechas) => {
              setTarifaSeleccionada(tarifa);
              setTicket(tarifa ? generarTicket() : '');
              if (fechas) {
                setFechas({
                  entrada: dayjs.utc(fechas.entrada).tz('America/Argentina/Buenos_Aires').toISOString(),
                  salida: dayjs.utc(fechas.salida).tz('America/Argentina/Buenos_Aires').toISOString(),
                });
              }
            }}
          />
        </>
      )}

      {tarifaSeleccionada && fechas && ticket && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 text-sm space-y-3">
          <p><strong>Ticket:</strong> {ticket}</p>
          <p><strong>Ingreso:</strong> {dayjs(fechas.entrada).format('DD/MM/YYYY, HH:mm:ss')}</p>
          <p><strong>Salida:</strong> {dayjs(fechas.salida).format('DD/MM/YYYY, HH:mm:ss')}</p>
          {tarifaSeleccionada.tipoEstadia !== 'libre' && (
            <p><strong>Duración:</strong> {tarifaSeleccionada.cantidad} {tarifaSeleccionada.tipoEstadia}(s)</p>
          )}
          <hr className="my-2" />
          {operator && <p><strong>Operador:</strong> {operator.name}</p>}
          {operator?.assignedParking && <p><strong>Parking:</strong> {operator.assignedParking.name}</p>}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="prepago"
              checked={prepago}
              onChange={(e) => setPrepago(e.target.checked)}
            />
            <label htmlFor="prepago" className="font-medium text-gray-700">Prepago</label>
          </div>

          {prepago && (
            <>
              <div className="flex flex-col">
                <label className="font-medium text-gray-700">Monto a pagar</label>
                <input
                  type="number"
                  value={montoPago ?? 0}
                  readOnly
                  className="border border-gray-300 rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium text-gray-700">Forma de pago</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as 'Efectivo' | 'Tarjeta' | 'QR')}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="QR">QR</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}

      <button
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar Datos'}
      </button>
    </FormContainer>
  );
};
