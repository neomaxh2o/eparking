'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FormContainer } from './FormContainer';
import { useTurno } from '@/app/context/TurnoContext';
import { useEstadias } from '@/modules/parking-sessions/hooks/useEstadias';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import { SubTarifa, ITarifa } from '@/interfaces/Tarifa/tarifa';
import { IEstadia } from '@/interfaces/Estadias/estadias';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import TicketCobro from '@/app/components/Parking/Estadias/Tickets/TicketCobro'; // <-- Importamos tu componente de ticket

dayjs.extend(utc);
dayjs.extend(timezone);

interface FormCobroProps {
  refresh: () => Promise<void>;
  ticketData: any;
  operatorId: string;
  nombreEstacionamiento: string; // 🔹 agregado
}



interface EstadoEstadia {
  mensaje: string;
  excedente: number | null;
  totalExceso: number;
}

// Type guard para tarifa libre
const esTarifaLibre = (sub: SubTarifa): sub is (SubTarifa & { tipoEstadia: 'libre' }) => {
  return sub.tipoEstadia === 'libre';
};

export const FormCobro: React.FC<FormCobroProps> = ({ refresh }) => {
  const { getEstadiaByTicket, updateEstadia, closeEstadia, loading } = useEstadias();
  const { operator } = useTurno();
  const { tarifas } = useTarifas();

  const [ticket, setTicket] = useState('');
  const [estadia, setEstadia] = useState<IEstadia | null>(null);
  const [tarifa, setTarifa] = useState<SubTarifa | null>(null);
  const [montoPago, setMontoPago] = useState(0);
  const [formaPago, setFormaPago] = useState<'Efectivo' | 'Tarjeta' | 'QR'>('Efectivo');
  const [horaSalidaTemporal, setHoraSalidaTemporal] = useState<dayjs.Dayjs | null>(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState('00:00:00');
  const [cantidadUsada, setCantidadUsada] = useState(0);
  const [exceso, setExceso] = useState<{ total: number; cantidad: number } | null>(null);
  const [puedeCobrarExceso, setPuedeCobrarExceso] = useState(false);
  const [estadoEstadia, setEstadoEstadia] = useState<EstadoEstadia | null>(null);
  const [mostrarTicket, setMostrarTicket] = useState(false); // <-- Estado para mostrar el ticket

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null); // <-- Ref para imprimir solo el ticket

  const formatTime = (horaEntrada: dayjs.Dayjs, horaSalida: dayjs.Dayjs) => {
    const diff = horaSalida.diff(horaEntrada, 'second');
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calcularMontoDinamico = (sub: SubTarifa, horaEntrada: dayjs.Dayjs, horaSalida: dayjs.Dayjs) => {
    const diffMin = horaSalida.diff(horaEntrada, 'minute', true);
    let cantidad = 0;
    let total = 0;

    if (esTarifaLibre(sub)) {
      if (diffMin <= 60) total = sub.precioUnitario;
      else {
        const excesoMin = diffMin - 60;
        let adicional = 0;
        if (excesoMin > 15) {
          const fracciones = Math.ceil((excesoMin - 15) / 30);
          adicional = fracciones * (sub.precioUnitario / 2);
        }
        total = sub.precioUnitario + adicional;
      }
      cantidad = diffMin / 60;
    } else {
      switch (sub.tipoEstadia) {
        case 'hora':
          cantidad = Math.ceil(diffMin / 60);
          break;
        case 'dia':
          cantidad = Math.ceil(diffMin / (60 * 24));
          break;
        case 'mes':
          cantidad = Math.ceil(diffMin / (60 * 24 * 30));
          break;
      }
      total = cantidad * sub.precioUnitario;
    }

    if ('bonificacionPorc' in sub && sub.bonificacionPorc) total *= 1 - sub.bonificacionPorc / 100;

    return { total: Math.ceil(total), cantidad };
  };

  const calcularEstadoEstadia = (est: IEstadia, sub: SubTarifa, ahora: dayjs.Dayjs) => {
    if (esTarifaLibre(sub)) {
      const monto = calcularMontoDinamico(sub, dayjs(est.horaEntrada), ahora).total;
      setEstadoEstadia({ mensaje: 'Estadía Activa', excedente: null, totalExceso: monto });
      setPuedeCobrarExceso(false);
      setExceso(null);
      return false;
    }

    const salida = dayjs(est.horaSalida).tz('America/Argentina/Buenos_Aires');

    if (ahora.isBefore(salida) || ahora.isSame(salida)) {
      setEstadoEstadia({ mensaje: 'Estadía en Rango', excedente: null, totalExceso: 0 });
      setPuedeCobrarExceso(false);
      setExceso(null);
      return true;
    } else {
      const diffMin = ahora.diff(salida, 'minute', true);
      let totalExceso = Math.ceil(diffMin / 60) * sub.precioUnitario;

      if ('bonificacionPorc' in sub && sub.bonificacionPorc) totalExceso *= 1 - sub.bonificacionPorc / 100;

      setEstadoEstadia({
        mensaje: 'Tiempo Excedido',
        excedente: diffMin,
        totalExceso: Math.ceil(totalExceso),
      });
      setPuedeCobrarExceso(true);
      setExceso({ total: Math.ceil(totalExceso), cantidad: diffMin / 60 });
      return false;
    }
  };

  const handleBuscarTicket = async () => {
    if (!ticket) return;
    const data = await getEstadiaByTicket(ticket);
    if (!data) return alert('Ticket no encontrado');

    setEstadia(data);

    const tarifaGeneral: ITarifa | undefined = tarifas.find((t) => t.category === data.categoria);
    if (!tarifaGeneral) return;

    let subTarifa: SubTarifa | undefined;
    switch (data.tipoEstadia) {
      case 'hora':
        if (tarifaGeneral.tarifasHora?.[0])
          subTarifa = { ...tarifaGeneral.tarifasHora[0], _id: tarifaGeneral._id, category: tarifaGeneral.category };
        break;
      case 'dia':
        if (tarifaGeneral.tarifasPorDia?.[0])
          subTarifa = { ...tarifaGeneral.tarifasPorDia[0], _id: tarifaGeneral._id, category: tarifaGeneral.category };
        break;
      case 'mes':
        if (tarifaGeneral.tarifaMensual?.[0])
          subTarifa = { ...tarifaGeneral.tarifaMensual[0], _id: tarifaGeneral._id, category: tarifaGeneral.category };
        break;
      case 'libre':
        if (tarifaGeneral.tarifaLibre?.[0])
          subTarifa = { ...tarifaGeneral.tarifaLibre[0], _id: tarifaGeneral._id, category: tarifaGeneral.category };
        break;
    }

    if (!subTarifa) return;
    setTarifa(subTarifa);

    const horaEntrada = dayjs(data.horaEntrada).tz('America/Argentina/Buenos_Aires');
    const ahora = dayjs().tz('America/Argentina/Buenos_Aires');
    setHoraSalidaTemporal(ahora);

    let cantidadCobrar = 0;
    let totalCobrar = 0;

    if (data.prepago && !esTarifaLibre(subTarifa)) {
      cantidadCobrar = data.cantidadHoras || data.cantidadDias || data.cantidadMeses || 0;
      totalCobrar = data.totalCobrado ?? cantidadCobrar * subTarifa.precioUnitario;
    } else {
      const calc = calcularMontoDinamico(subTarifa, horaEntrada, ahora);
      cantidadCobrar = calc.cantidad;
      totalCobrar = calc.total;
    }

    setMontoPago(totalCobrar);
    setCantidadUsada(cantidadCobrar);
    calcularEstadoEstadia(data, subTarifa, ahora);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const nowInterval = dayjs().tz('America/Argentina/Buenos_Aires');
      setHoraSalidaTemporal(nowInterval);
      setTiempoTranscurrido(formatTime(horaEntrada, nowInterval));

      if (subTarifa) {
        const calc = calcularMontoDinamico(subTarifa, horaEntrada, nowInterval);
        setMontoPago(calc.total);
        setCantidadUsada(calc.cantidad);

        if (!esTarifaLibre(subTarifa)) {
          calcularEstadoEstadia(data, subTarifa, nowInterval);
        } else {
          setEstadoEstadia({ mensaje: 'Estadía Activa', excedente: null, totalExceso: calc.total });
          setPuedeCobrarExceso(false);
          setExceso(null);
        }
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCobrar = async () => {
  if (!estadia || !operator || montoPago <= 0) return;

  const metodo = formaPago.toLowerCase() as 'efectivo' | 'tarjeta' | 'qr';

  console.log("🔎 Estado ANTES de cobrar:", estadia.estado);

  let result;

  if (estadia.tipoEstadia === 'libre') {
    // 🔹 cerrar la estadía directamente
    result = await closeEstadia(estadia._id, montoPago, metodo);
  } else {
    // 🔹 actualizar (hora, día, mensual)
    const horaSalidaNormalizada = dayjs()
      .tz('America/Argentina/Buenos_Aires')
      .toISOString();

    result = await updateEstadia({
      _id: estadia._id,
      totalCobrado: montoPago,
      metodoPago: metodo,
      horaSalida: horaSalidaNormalizada,
    });
  }

  console.log("✅ Respuesta del backend:", result);
  console.log("🔎 Estado DESPUÉS de cobrar:", result?.estado);

  // Mostrar ticket después del cobro
  setMostrarTicket(true);

  if (timerRef.current) clearInterval(timerRef.current);
  await refresh();
};



  const handleCerrarTicket = () => {
    setMostrarTicket(false);
    setTicket('');
    setEstadia(null);
    setTarifa(null);
    setMontoPago(0);
    setHoraSalidaTemporal(null);
    setTiempoTranscurrido('00:00:00');
    setCantidadUsada(0);
    setFormaPago('Efectivo');
    setExceso(null);
    setPuedeCobrarExceso(false);
    setEstadoEstadia(null);
  };

  const handleImprimir = () => {
    if (!ticketRef.current) return;
    const printContents = ticketRef.current.innerHTML;
    const newWindow = window.open('', '_blank', 'width=400,height=600');
    if (!newWindow) return;
    newWindow.document.write('<html><head><title>Ticket</title></head><body>');
    newWindow.document.write(printContents);
    newWindow.document.write('</body></html>');
    newWindow.document.close();
    newWindow.print();
  };

  return (
    <FormContainer title="Cobro de Estadia" className="max-w-3xl p-8">
      {/* INPUT Y BOTÓN DE BÚSQUEDA */}
      <div className="flex flex-col mb-4">
        <label className="font-medium text-gray-700 mb-2">Número de Ticket</label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ej: T-123456-789"
            value={ticket}
            onChange={(e) => setTicket(e.target.value.toUpperCase())}
            className="border border-gray-300 rounded-lg p-3 flex-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleBuscarTicket}
            className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* DETALLE DE ESTADÍA */}
      {estadia && tarifa && (
        <div className="mt-6 p-6 border rounded-2xl bg-white shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xl font-semibold">Patente: {estadia.patente}</p>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
              {tarifa.tipoEstadia.toUpperCase()} {estadia.prepago && '(Prepago)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Hora Entrada:</p>
              <p className="font-mono">{dayjs(estadia.horaEntrada).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY, HH:mm:ss')}</p>
            </div>
            {!esTarifaLibre(tarifa) && (
              <div>
                <p className="text-gray-600">Hora Salida Programada:</p>
                <p className="font-mono">{dayjs(estadia.horaSalida).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY, HH:mm:ss')}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">Hora Actual:</p>
              <p className="font-mono">{dayjs().tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY, HH:mm:ss')}</p>
            </div>
            <div>
              <p className={`font-bold ${estadoEstadia?.mensaje.includes('Excedido') ? 'text-red-600' : 'text-green-700'}`}>
                {estadoEstadia?.mensaje}
              </p>
              {estadoEstadia?.excedente && (
                <p className="text-red-600">
                  Tiempo Excedido: {Math.floor(estadoEstadia.excedente / 60)}h {Math.floor(estadoEstadia.excedente % 60)}m
                  <br />
                  Total a cobrar: {estadoEstadia.totalExceso} ARS
                </p>
              )}
            </div>
          </div>

          <hr />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Precio unitario:</span>
              <span className="font-semibold">{tarifa.precioUnitario} ARS</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-red-600">
              <span>Total a cobrar:</span>
              <span>{montoPago} ARS</span>
            </div>
          </div>

          <div className="flex flex-col mt-4">
            <label className="font-medium mb-1">Monto a cobrar</label>
            <input
              type="number"
              value={montoPago}
              onChange={(e) => setMontoPago(Number(e.target.value))}
              className="border p-2 rounded-lg"
            />
          </div>

          <div className="flex flex-col mt-2">
            <label className="font-medium mb-1">Forma de pago</label>
            <select
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value as 'Efectivo' | 'Tarjeta' | 'QR')}
              className="border p-2 rounded-lg"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="QR">QR</option>
            </select>
          </div>

          {puedeCobrarExceso && exceso && !esTarifaLibre(tarifa) && (
            <button
              onClick={() => {
                setMontoPago((prev) => prev + exceso.total);
                setPuedeCobrarExceso(false);
                alert(`Se agregó el exceso de ${Math.ceil(exceso.cantidad)} horas por ${exceso.total} ARS`);
              }}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 mt-2"
            >
              Cobrar Excedente
            </button>
          )}

          <button
            onClick={handleCobrar}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 mt-4"
          >
            {loading ? 'Procesando...' : 'Confirmar Cobro'}
          </button>
        </div>
      )}

      {/* MODAL DE TICKET */}
      {mostrarTicket && estadia && tarifa && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={handleCerrarTicket}
            >
              ✖
            </button>

            <div ref={ticketRef}>
              <TicketCobro
                estadia={estadia}
                tarifa={tarifa}
                montoCobrado={montoPago}
                nombreEstacionamiento="Estacionamiento Callejero"
                operatorName={operator?.name || 'Operador'}
              />
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={handleImprimir}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Imprimir Ticket
              </button>
              <button
                onClick={handleCerrarTicket}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </FormContainer>
  );
};
