'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import TicketSalida from './TicketSalida';
import { useSalida } from '@/app/hooks/Parking/Caja/useSalida';
import { useCerrarPrepago } from '@/modules/parking-sessions/hooks/useCerrarPrepago';
import type { SalidaData } from '@/app/hooks/Parking/Caja/useSalida';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import type { ITarifa } from '@/interfaces/Tarifa/tarifa';
import type { TicketData } from '@/interfaces/Estadias/ticket';


type MetodoPago = 'efectivo' | 'tarjeta' | 'qr' | 'otros';
type Categoria = 'Automóvil' | 'Camioneta' | 'Bicicleta' | 'Motocicleta' | 'Otros';
type TipoEstadia = 'hora' | 'dia' | 'libre';

interface EditTicketProps {
  nombreEstacionamiento: string;
  refresh?: () => void | Promise<void>;

  // Props que estás pasando desde el padre
  ticketData: TicketData;
  tarifas: ITarifa[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTicket: TicketData) => void;
   operatorId?: string; // <-- agregar
}


const categorias: Categoria[] = ['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'];

const EditTicket: React.FC<EditTicketProps> = ({ nombreEstacionamiento, refresh }) => {
  const { data: session } = useSession();
  const operatorId = session?.user?.id;
  const operatorName = session?.user?.name ?? 'Operador';

  const { registrarSalida, obtenerTicket, loading } = useSalida();
  const { cerrarPrepago, loading: loadingPrepago, error: errorPrepago } = useCerrarPrepago();
  const { getTarifaByCategory } = useTarifas();

  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketLocal, setTicketLocal] = useState<SalidaData | null>(null);
  const [patente, setPatente] = useState('');
  const [tipoEstadia, setTipoEstadia] = useState<TipoEstadia>('hora');
  const [cantidadHoras, setCantidadHoras] = useState(1);
  const [cantidadDias, setCantidadDias] = useState(1);
  const [prepago, setIsPrepago] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [pagadoConfirmado, setPagadoConfirmado] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>('Automóvil');
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<ITarifa | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [tiempoActual, setTiempoActual] = useState(Date.now());
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!operatorId) return <p className="text-red-600 font-semibold">Debe iniciar sesión como operador</p>;

  /** Función que transforma patente a mayúscula */
  const toUpperCase = (value: string) => value.toUpperCase();

  const calcularCobro = () => {
  if (!tarifaSeleccionada) return { total: 0, detalle: '' };

  if (tipoEstadia === 'hora') {
    const tarifaHora = tarifaSeleccionada.tarifasHora?.[0]; // primera tarifa disponible
    if (!tarifaHora) return { total: 0, detalle: '' };
    const total = cantidadHoras * tarifaHora.precioUnitario;
    return { total, detalle: `${cantidadHoras} hora(s) x $${tarifaHora.precioUnitario} = $${total}` };
  }

  if (tipoEstadia === 'dia') {
    const tarifaDia = tarifaSeleccionada.tarifasPorDia?.find(d => d.cantidad === cantidadDias);
    if (!tarifaDia) return { total: 0, detalle: '' };
    const total = tarifaDia.precioConDescuento ?? tarifaDia.precioUnitario;
    return { total, detalle: `${cantidadDias} día(s) = $${total}` };
  }

  if (tipoEstadia === 'libre') {
    const tarifaLibre = tarifaSeleccionada.tarifaLibre?.[0];
    if (!tarifaLibre) return { total: 0, detalle: '' };
    const total = tarifaLibre.precioConDescuento ?? tarifaLibre.precioUnitario;
    return { total, detalle: `Estadía libre = $${total}` };
  }

  return { total: 0, detalle: '' };
};



  const totalDinamico = useMemo(() => calcularCobro(), [tarifaSeleccionada, tipoEstadia, cantidadHoras, cantidadDias, tiempoActual]);

  useEffect(() => {
    if (!ticketNumber) {
      setTicketLocal(null);
      return;
    }

    const handler = setTimeout(async () => {
      const ticket = await obtenerTicket(ticketNumber);
      if (ticket) {
        setTicketLocal(ticket);
        setPatente(ticket.patente ? toUpperCase(ticket.patente) : '');
        setTipoEstadia(ticket.tipoEstadia || 'hora');
        setCategoriaSeleccionada(ticket.categoria || 'Automóvil');
        setIsPrepago(ticket.prepago || false);
        setPagadoConfirmado(false);
        if (ticket.tipoEstadia === 'hora') setCantidadHoras(ticket.cantidadHoras ?? 1);
        if (ticket.tipoEstadia === 'dia') setCantidadDias(ticket.cantidadDias ?? 1);
      } else setTicketLocal(null);
    }, 800);

    return () => clearTimeout(handler);
  }, [ticketNumber]);

  useEffect(() => {
  const fetchTarifa = async () => {
    const tarifa = await getTarifaByCategory(categoriaSeleccionada);
    setTarifaSeleccionada(tarifa || null);

    if (tarifa && tipoEstadia === 'dia' && tarifa.tarifasPorDia?.length) {
      // Cambié 'day' por 'cantidad' según la interface actual
      setCantidadDias(tarifa.tarifasPorDia[0].cantidad);
    }
  };

  fetchTarifa();
}, [categoriaSeleccionada, tipoEstadia, getTarifaByCategory]);


  useEffect(() => {
    const interval = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSalida = async () => {
    if (!ticketLocal || !tarifaSeleccionada) return;
    const horaSalida = new Date().toISOString();

    const payload: SalidaData = {
      ticketNumber: ticketLocal.ticketNumber ?? '',
      operatorId: operatorId ?? '',
      metodoPago,
      categoria: categoriaSeleccionada,
      tipoEstadia,
      patente: toUpperCase(patente),
      tarifaId: tarifaSeleccionada._id,
      horaEntrada: ticketLocal.horaEntrada,
      horaSalida,
      cantidadHoras: tipoEstadia === 'hora' ? cantidadHoras : undefined,
      cantidadDias: tipoEstadia === 'dia' ? cantidadDias : undefined,
      prepago,
      estado: 'activa',
      totalCobrado: totalDinamico.total ?? 0,
      detalleCobro: totalDinamico.detalle ?? '',
      cliente: ticketLocal.cliente,
      notas: ticketLocal.notas,
      tiempoTotal: '-',
    };

    let res: SalidaData | null = null;
    let mensaje = '';

    if (prepago) {
      if (!pagadoConfirmado) {
        alert('Debés confirmar el pago antes de cerrar un ticket prepago.');
        return;
      }
      res = await cerrarPrepago(ticketLocal.ticketNumber ?? '', { ...payload, pagado: true });
      mensaje = res ? `✅ Ticket prepago cerrado correctamente. Total cobrado: $${totalDinamico.total}` : '❌ Error al cerrar prepago';
    } else {
      res = await registrarSalida(payload);
      mensaje = res ? `✅ Salida registrada correctamente. Total a pagar: $${totalDinamico.total}` : '❌ Error al registrar salida';
    }

    if (!res) return;

    setTicketLocal(res);
    setMensajeModal(mensaje);
    setIsModalOpen(true);
    if (refresh) await refresh();
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setTicketNumber('');
    setTicketLocal(null);
    setPatente('');
    setTipoEstadia('hora');
    setCantidadHoras(1);
    setCantidadDias(1);
    setIsPrepago(false);
    setCategoriaSeleccionada('Automóvil');
    setTarifaSeleccionada(null);
    setMetodoPago('efectivo');
    setPagadoConfirmado(false);
    setMensajeModal('');
  };

  const handleImprimir = () => {
    if (!ticketRef.current) return;
    const printContents = ticketRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const diasDisponibles = tarifaSeleccionada?.tarifasPorDia?.map(d => d.cantidad) ?? [];


  return (
    <section className="p-4 border rounded shadow space-y-2">
      <h3 className="font-semibold">Registrar Salida</h3>
      <input
        className="border p-1 w-full"
        placeholder="Número de Ticket"
        value={ticketNumber}
        onChange={(e) => setTicketNumber(e.target.value)}
      />

      {ticketLocal && (
        <>
          <input
            className="border p-1 w-full"
            placeholder="Patente"
            value={patente}
            onChange={(e) => setPatente(toUpperCase(e.target.value))}
          />

          <select
            className="border p-1 w-full"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value as Categoria)}
          >
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="border p-1 w-full"
            value={tipoEstadia}
            onChange={(e) => setTipoEstadia(e.target.value as TipoEstadia)}
          >
            <option value="hora">Por hora</option>
            <option value="dia">Por día</option>
            <option value="libre">Libre</option>
          </select>

          {tipoEstadia === 'hora' && (
            <input
              className="border p-1 w-full"
              type="number"
              min={1}
              value={cantidadHoras}
              onChange={(e) => setCantidadHoras(Number(e.target.value))}
            />
          )}

          {tipoEstadia === 'dia' && diasDisponibles.length > 0 && (
            <select
              className="border p-1 w-full"
              value={cantidadDias}
              onChange={(e) => setCantidadDias(Number(e.target.value))}
            >
              {diasDisponibles.map((d) => (
                <option key={d} value={d}>{d} día(s)</option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prepago}
              onChange={(e) => setIsPrepago(e.target.checked)}
            />
            Estadía Prepaga
          </label>

          {prepago && (
            <label className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-amber-800">
              <input
                type="checkbox"
                checked={pagadoConfirmado}
                onChange={(e) => setPagadoConfirmado(e.target.checked)}
              />
              Confirmar pago realizado
            </label>
          )}
        </>
      )}

      <select
        className="border p-1 w-full"
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
      >
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="qr">QR</option>
        <option value="otros">Otros</option>
      </select>

      {errorPrepago && (
        <div className="p-2 mb-2 bg-red-100 border border-red-400 text-red-800 rounded">
          {errorPrepago}
        </div>
      )}

      {ticketLocal && (
        <div className="p-2 border rounded bg-gray-50 space-y-1">
          <p><strong>Ticket:</strong> {ticketLocal.ticketNumber}</p>
          <p><strong>Patente:</strong> {patente || 'SIN PATENTE'}</p>
          <p><strong>Categoría:</strong> {categoriaSeleccionada}</p>
          <p><strong>Tipo de estadía:</strong> {tipoEstadia}</p>
          <p><strong>Prepago:</strong> {prepago ? 'Sí' : 'No'}</p>
          <p><strong>Método de pago:</strong> {metodoPago}</p>
          <p><strong>Total a pagar:</strong> ${totalDinamico.total}</p>
          <p><strong>Detalle cobro:</strong> {totalDinamico.detalle}</p>
        </div>
      )}

      <button
        className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
        onClick={handleSalida}
        disabled={loading || loadingPrepago || !ticketNumber || !ticketLocal}
      >
        Registrar Salida
      </button>

      <Modal isOpen={isModalOpen} onClose={handleCerrarModal}>
        {mensajeModal && (
          <div className="p-2 mb-2 bg-green-100 border border-green-400 text-green-800 rounded">
            {mensajeModal}
          </div>
        )}

        <div ref={ticketRef}>
          {ticketLocal && (
            <TicketSalida
              ticket={ticketLocal}
              nombreEstacionamiento={nombreEstacionamiento}
              operatorName={operatorName}
              parkingName={nombreEstacionamiento}
            />
          )}
        </div>

        <button
          onClick={handleImprimir}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Imprimir Ticket
        </button>
      </Modal>
    </section>
  );
};

export default EditTicket;
