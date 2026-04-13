'use client';

import React, { useMemo, useState } from 'react';
import { useIngreso, categorias } from '@/app/hooks/Parking/Caja/useIngreso';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import type { TicketCaja, MetodoPago } from '@/modules/caja/types/caja.types';
import type { Categoria, ITarifa, TarifaDia, TarifaHora, TarifaLibre, SubTarifa } from '@/interfaces/Tarifa/tarifa';

type TipoEstadia = 'hora' | 'dia' | 'libre';

function normalizeTipo(value: string): TipoEstadia {
  if (value === 'hora' || value === 'dia' || value === 'libre') return value;
  return 'libre';
}

function buildSubtarifas(tarifa: ITarifa | null, tipo: TipoEstadia): SubTarifa[] {
  if (!tarifa) return [];

  if (tipo === 'hora') {
    return (tarifa.tarifasHora ?? []).map((item: TarifaHora) => ({
      ...item,
      _id: tarifa._id,
      category: tarifa.category,
    }));
  }

  if (tipo === 'dia') {
    return (tarifa.tarifasPorDia ?? []).map((item: TarifaDia) => ({
      ...item,
      _id: tarifa._id,
      category: tarifa.category,
    }));
  }

  return (tarifa.tarifaLibre ?? []).map((item: TarifaLibre) => ({
    ...item,
    _id: tarifa._id,
    category: tarifa.category,
  }));
}

function formatSubtarifaLabel(item: SubTarifa) {
  if (item.tipoEstadia === 'hora') {
    return `${item.cantidad} hora(s) · $${item.precioTotal.toFixed(2)}`;
  }
  if (item.tipoEstadia === 'dia') {
    return `${item.cantidad} día(s) · $${item.precioTotal.toFixed(2)}`;
  }
  return `Libre · $${item.precioTotal.toFixed(2)}`;
}

export default function IngresoEstadiaV2() {
  const { registrarIngreso, loading, error, data } = useIngreso();
  const { tarifas } = useTarifas();

  const [patente, setPatente] = useState('');
  const [categoria, setCategoria] = useState<(typeof categorias)[number]>('Automóvil');
  const [tipoEstadia, setTipoEstadia] = useState<TipoEstadia>('hora');
  const [prepago, setPrepago] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteApellido, setClienteApellido] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [ultimoTicket, setUltimoTicket] = useState<TicketCaja | null>(null);
  const [subtarifaIdx, setSubtarifaIdx] = useState<number | null>(null);
  const [metodoPagoPrepago, setMetodoPagoPrepago] = useState<MetodoPago>('efectivo');
  const [pagoConfirmado, setPagoConfirmado] = useState(false);

  const ticketMostrado = ultimoTicket ?? data;
  const prepagoActivo = prepago || tipoEstadia === 'dia';

  const tarifaActual = useMemo(() => {
    return tarifas.find((t) => t.category === (categoria as Categoria)) ?? null;
  }, [tarifas, categoria]);

  const subtarifasDisponibles = useMemo(() => {
    return buildSubtarifas(tarifaActual, tipoEstadia);
  }, [tarifaActual, tipoEstadia]);

  const tarifaSeleccionada = useMemo(() => {
    if (subtarifaIdx === null) return null;
    return subtarifasDisponibles[subtarifaIdx] ?? null;
  }, [subtarifaIdx, subtarifasDisponibles]);

  const preview = useMemo(
    () => ({
      ticket: ticketMostrado?.ticketNumber ?? 'Pendiente de generar',
      patente: (ticketMostrado?.patente || patente.trim().toUpperCase()) || 'SIN PATENTE',
      categoria: ticketMostrado?.categoria ?? categoria,
      tipoEstadia: ticketMostrado?.tipoEstadia ?? tipoEstadia,
      cantidad:
        ticketMostrado?.cantidad ??
        tarifaSeleccionada?.cantidad ??
        (tipoEstadia === 'libre' ? 0 : '-'),
      prepago: ticketMostrado?.prepago ?? prepagoActivo,
      tarifa: tarifaSeleccionada ? formatSubtarifaLabel(tarifaSeleccionada) : 'Sin selección',
    }),
    [ticketMostrado, patente, categoria, tipoEstadia, tarifaSeleccionada, prepago],
  );

  const handleTipoEstadia = (value: TipoEstadia) => {
    setTipoEstadia(value);
    setSubtarifaIdx(null);
  };

  const handleSubmit = async () => {
    const patenteNormalizada = patente.trim().toUpperCase();

    if (!patenteNormalizada) {
      alert('Debés ingresar una patente.');
      return;
    }

    if (!tarifaSeleccionada) {
      alert('Debés seleccionar una tarifa válida de la playa.');
      return;
    }

    if (prepagoActivo && !pagoConfirmado) {
      alert('Debés confirmar el pago del prepago antes de registrar la estadía.');
      return;
    }

    if (tipoEstadia === 'dia') {
      if (!clienteNombre.trim() || !clienteApellido.trim() || !clienteTelefono.trim()) {
        alert('Para estadías por día debés completar nombre, apellido y teléfono del cliente.');
        return;
      }
    }

    const result = await registrarIngreso({
      patente: patenteNormalizada,
      categoria,
      tipoEstadia: normalizeTipo(tarifaSeleccionada.tipoEstadia),
      cantidad: tarifaSeleccionada.tipoEstadia === 'libre' ? 0 : tarifaSeleccionada.cantidad,
      prepago: prepagoActivo,
      tarifaId: tarifaSeleccionada._id,
      tarifaSeleccionada: {
        tarifaId: tarifaSeleccionada._id,
        tipoEstadia: normalizeTipo(tarifaSeleccionada.tipoEstadia),
        cantidad: tarifaSeleccionada.tipoEstadia === 'libre' ? 0 : tarifaSeleccionada.cantidad,
        precioUnitario: tarifaSeleccionada.precioUnitario,
        precioTotal: tarifaSeleccionada.precioTotal,
      },
      cliente:
        clienteNombre || clienteApellido || clienteTelefono
          ? {
              nombre: clienteNombre || undefined,
              apellido: clienteApellido || undefined,
              telefono: clienteTelefono || undefined,
            }
          : undefined,
      metodoPago: prepagoActivo ? metodoPagoPrepago : undefined,
      pagado: prepagoActivo ? pagoConfirmado : undefined,
    });

    if (!result) return;

    setUltimoTicket(result);
    setPatente('');
    setCategoria('Automóvil');
    setTipoEstadia('hora');
    setPrepago(false);
    setMetodoPagoPrepago('efectivo');
    setPagoConfirmado(false);
    setClienteNombre('');
    setClienteApellido('');
    setClienteTelefono('');
    setSubtarifaIdx(null);
  };

  return (
    <section className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ingreso de estadía</h2>
        <p className="mt-1 text-sm text-gray-500">
          Alta rápida de ticket usando exclusivamente subtarifas reales de la playa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Patente</label>
            <input
              value={patente}
              onChange={(e) => setPatente(e.target.value.toUpperCase())}
              placeholder="AA123BB"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value as (typeof categorias)[number]);
                setSubtarifaIdx(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              {categorias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Tipo de estadía
            </label>
            <select
              value={tipoEstadia}
              onChange={(e) => handleTipoEstadia(e.target.value as TipoEstadia)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="hora">Por hora</option>
              <option value="dia">Por día</option>
              <option value="libre">Libre</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tarifa disponible</label>
            <select
              value={subtarifaIdx ?? ''}
              onChange={(e) => setSubtarifaIdx(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar subtarifa</option>
              {subtarifasDisponibles.map((item, idx) => (
                <option key={`${item.tipoEstadia}-${idx}`} value={idx}>
                  {formatSubtarifaLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            {tipoEstadia === 'dia' ? (
              <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                Las estadías por día son prepago obligatorio y requieren nombre, apellido y teléfono del cliente.
              </div>
            ) : (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={prepago}
                  onChange={(e) => setPrepago(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Ticket prepago</span>
              </label>
            )}

            {prepagoActivo && tarifaSeleccionada && (
              <div className="space-y-3 rounded-xl border border-green-300 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">Bloque de cobranza prepago</p>
                <p className="text-sm text-green-900">
                  <strong>Monto a cobrar:</strong> ${tarifaSeleccionada.precioTotal.toFixed(2)}
                </p>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Forma de pago</label>
                  <select
                    value={metodoPagoPrepago}
                    onChange={(e) => setMetodoPagoPrepago(e.target.value as MetodoPago)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="qr">QR</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={pagoConfirmado}
                    onChange={(e) => setPagoConfirmado(e.target.checked)}
                  />
                  Confirmar pago del prepago
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nombre {tipoEstadia === 'dia' ? '*' : ''}
              </label>
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder={tipoEstadia === 'dia' ? 'Nombre requerido' : 'Nombre opcional'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Apellido {tipoEstadia === 'dia' ? '*' : ''}
              </label>
              <input
                value={clienteApellido}
                onChange={(e) => setClienteApellido(e.target.value)}
                placeholder={tipoEstadia === 'dia' ? 'Apellido requerido' : 'Apellido opcional'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Teléfono {tipoEstadia === 'dia' ? '*' : ''}
              </label>
              <input
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder={tipoEstadia === 'dia' ? 'Teléfono requerido' : 'Teléfono opcional'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'Registrar ingreso'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="text-lg font-bold text-gray-900">Resumen de la estadía</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p><strong>Patente:</strong> {preview.patente}</p>
              <p><strong>Categoría:</strong> {preview.categoria}</p>
              <p><strong>Tipo:</strong> {preview.tipoEstadia}</p>
              <p><strong>Unidad:</strong> {String(preview.cantidad)}</p>
              <p><strong>Tarifa:</strong> {preview.tarifa}</p>
              <p><strong>Prepago:</strong> {preview.prepago ? 'Sí' : 'No'}</p>
            </div>
          </div>

          {ticketMostrado && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-bold text-gray-900">Último ticket creado</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p><strong>Ticket:</strong> {ticketMostrado.ticketNumber}</p>
                <p><strong>Patente:</strong> {ticketMostrado.patente || 'SIN PATENTE'}</p>
                <p><strong>Categoría:</strong> {ticketMostrado.categoria}</p>
                <p><strong>Tipo:</strong> {ticketMostrado.tipoEstadia}</p>
                <p><strong>Unidad:</strong> {ticketMostrado.cantidad ?? '-'}</p>
                <p>
                  <strong>Ingreso:</strong>{' '}
                  {ticketMostrado.horaEntrada
                    ? new Date(ticketMostrado.horaEntrada).toLocaleString()
                    : '-'}
                </p>
                <p><strong>Estado:</strong> {ticketMostrado.estado || '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
