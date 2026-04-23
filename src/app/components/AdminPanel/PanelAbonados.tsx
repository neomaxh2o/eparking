'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tab } from '@headlessui/react';
import { useParkingLots } from '@/modules/parking/hooks/useParkingLots';
import { useTarifas } from '@/app/hooks/Parking/useTarifas';
import { useClientsNavigation } from '@/app/components/AdminPanel/ClientsNavigationContext';
import { useOwnerOperations } from '@/app/components/AdminPanel/OwnerOperationsContext';

type Vehiculo = { patente: string; modelo?: string; categoria?: string; activo: boolean };
type Acceso = { tipo: 'qr' | 'rfid' | 'manual' | 'otro'; valor: string; descripcion?: string; activo: boolean };

interface ClientItem {
  _id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  patenteVehiculo?: string;
  modeloVehiculo?: string;
  categoriaVehiculo?: string;
  commercialStatus?: {
    hasAbonado?: boolean;
    numeroAbonado?: number | null;
    abonadoEstado?: string | null;
    pendingDocuments?: number;
    pendingAmount?: number;
  };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PanelAbonados() {
  const clientsNavigation = useClientsNavigation();
  const ownerOperations = useOwnerOperations();
  const inlineStatusEnabled = !ownerOperations;
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [abonados, setAbonados] = useState<any[]>([]);
  const [abonadosByClientId, setAbonadosByClientId] = useState<Record<string, any>>({});
  const { parkings } = useParkingLots();
  const { tarifas, fetchTarifas } = useTarifas();
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientSearchMode, setClientSearchMode] = useState<'all' | 'dni' | 'nombre' | 'email'>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [abonadoSearchMode, setAbonadoSearchMode] = useState<'all' | 'numeroAbonado' | 'dni' | 'nombre' | 'email'>('all');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [creationSummary, setCreationSummary] = useState<any | null>(null);

  useEffect(() => {
    if (!ownerOperations) return;
    if (error) ownerOperations.setStatusMessage?.({ type: 'error', text: error });
  }, [error, ownerOperations]);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([{ patente: '', modelo: '', categoria: '', activo: true }]);
  const [accesos, setAccesos] = useState<Acceso[]>([{ tipo: 'manual', valor: '', descripcion: '', activo: true }]);
  const [observaciones, setObservaciones] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [assignedParking, setAssignedParking] = useState('');
  const [tarifaMensualId, setTarifaMensualId] = useState('');
  const [tipoFacturacion, setTipoFacturacion] = useState<'mensual' | 'diaria' | 'hora'>('mensual');
  const [chargeNow, setChargeNow] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargePaymentMethod, setChargePaymentMethod] = useState<'efectivo' | 'tarjeta' | 'qr' | 'otros'>('efectivo');
  const [chargePaymentReference, setChargePaymentReference] = useState('');

  const [editVehiculos, setEditVehiculos] = useState<Vehiculo[]>([]);
  const [editAccesos, setEditAccesos] = useState<Acceso[]>([]);
  const [editObservaciones, setEditObservaciones] = useState('');
  const [editFechaVencimiento, setEditFechaVencimiento] = useState('');

  const fetchClients = async () => {
    const params = new URLSearchParams();
    if (clientSearch.trim()) params.set('search', clientSearch.trim());
    if (clientSearchMode !== 'all') params.set('searchBy', clientSearchMode);

    const usersRes = await fetch(`/api/v2/users/search${params.toString() ? `?${params.toString()}` : ''}`);
    const usersData = await usersRes.json();
    const usersList = Array.isArray(usersData?.users) ? usersData.users : [];
    setClients(usersList);
  };

  const fetchAbonados = async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (abonadoSearchMode !== 'all') params.set('searchBy', abonadoSearchMode);
    if (estadoFiltro) params.set('estado', estadoFiltro);
    if (ownerOperations?.selectedParkingId) params.set('assignedParking', ownerOperations.selectedParkingId);

    const abonadosRes = await fetch(`/api/v2/abonados${params.toString() ? `?${params.toString()}` : ''}`);
    const abonadosData = await abonadosRes.json();
    const items = Array.isArray(abonadosData) ? abonadosData : [];
    setAbonados(items);
    setAbonadosByClientId(items.reduce((acc: Record<string, any>, item: any) => {
      if (item?.clientId) acc[String(item.clientId)] = item;
      return acc;
    }, {}));
  };

  const fetchData = async () => {
    try {
      await Promise.all([fetchClients(), fetchAbonados()]);
    } catch {
      setError('No se pudo cargar la información de abonados.');
    }
  };

  useEffect(() => {
    void fetchTarifas();
  }, [fetchTarifas]);

  useEffect(() => {
    void fetchClients();
  }, [clientSearch, clientSearchMode]);

  useEffect(() => {
    void fetchAbonados();
  }, [search, estadoFiltro, abonadoSearchMode, ownerOperations?.selectedParkingId]);

  const selectedClient = clients.find((c) => c._id === clientId);

  useEffect(() => {
    if (!selectedClient) return;
    setVehiculos([{ patente: selectedClient.patenteVehiculo || '', modelo: selectedClient.modeloVehiculo || '', categoria: selectedClient.categoriaVehiculo || '', activo: true }]);
  }, [selectedClient]);

  const tarifasMensuales = useMemo(() => {
    return (tarifas || []).filter((t: any) => {
      const parkingMatch = !assignedParking || String(t.parkinglotId) === String(assignedParking);
      const mensuales = Array.isArray(t.tarifaMensual) && t.tarifaMensual.length > 0;
      return parkingMatch && mensuales;
    });
  }, [tarifas, assignedParking]);

  const tarifaMensualSeleccionada = useMemo(() => {
    return tarifasMensuales.find((t: any) => String(t._id) === String(tarifaMensualId));
  }, [tarifasMensuales, tarifaMensualId]);

  const filteredClients = ownerOperations?.selectedParkingId
    ? clients.filter((client) => String((client as any).assignedParkingId || (client as any).assignedParking || '') === String(ownerOperations.selectedParkingId))
    : clients;

  const filteredAbonados = ownerOperations?.selectedParkingId
    ? abonados.filter((abonado) => String(abonado.assignedParking || '') === String(ownerOperations.selectedParkingId))
    : abonados;

  const handleCreate = async () => {
    if (!clientId) {
      setError('Debes seleccionar un cliente.');
      return;
    }

    if (abonadosByClientId[clientId]) {
      setError('El cliente seleccionado ya tiene un abonado asociado.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      setCreationSummary(null);

      const mensual = tarifaMensualSeleccionada?.tarifaMensual?.[0];
      const initialChargeAmount = Number(
        chargeAmount ||
          (mensual?.precioTotal ?? mensual?.precioConDescuento ?? mensual?.precioUnitario ?? 0),
      );
      const payload = {
        clientId,
        assignedParking: assignedParking || null,
        billingMode: tipoFacturacion,
        tarifaId: tarifaMensualSeleccionada?._id ?? '',
        tarifaNombre: tarifaMensualSeleccionada ? `${tarifaMensualSeleccionada.category} · mensual` : '',
        importeBase: Number(mensual?.precioTotal ?? mensual?.precioConDescuento ?? mensual?.precioUnitario ?? 0),
        tarifaSnapshot: mensual ? { ...mensual, tarifaParentId: tarifaMensualSeleccionada._id, category: tarifaMensualSeleccionada.category } : {},
        vehiculos: vehiculos.filter((v) => v.patente.trim()),
        accesos: accesos.filter((a) => a.valor.trim()),
        observaciones,
        fechaVencimiento: fechaVencimiento || null,
        initialCharge: {
          enabled: chargeNow,
          amount: initialChargeAmount,
          markAsPaid: chargeNow,
          paymentMethod: chargePaymentMethod,
          paymentProvider: 'manual',
          paymentReference: chargePaymentReference,
          tipoFacturacion,
        },
      };

      const res = await fetch('/api/v2/abonados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear el abonado');

      const successMessage = `Abonado creado correctamente. Nro asignado: ${data?.numeroAbonado ?? '-'}.`;
      setMessage(successMessage);
      ownerOperations?.setStatusMessage?.({ type: 'success', text: successMessage });
      setCreationSummary({
        numeroAbonado: data?.numeroAbonado ?? null,
        clientName: `${data?.nombre ?? ''} ${data?.apellido ?? ''}`.trim(),
        initialInvoice: data?.initialInvoice ?? null,
      });
      setClientId('');
      setClientSearch('');
      setVehiculos([{ patente: '', modelo: '', categoria: '', activo: true }]);
      setAccesos([{ tipo: 'manual', valor: '', descripcion: '', activo: true }]);
      setObservaciones('');
      setFechaVencimiento('');
      setAssignedParking('');
      setTarifaMensualId('');
      setChargeNow(false);
      setChargeAmount('');
      setChargePaymentMethod('efectivo');
      setChargePaymentReference('');
      await Promise.all([fetchAbonados(), fetchClients()]);
      setTabIndex(0);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (abonadoId: string, estado: 'activo' | 'suspendido' | 'vencido') => {
    try {
      const res = await fetch(`/api/v2/abonados/${abonadoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar estado');
      const successMessage = `Estado actualizado a ${estado}.`;
      setMessage(successMessage);
      ownerOperations?.setStatusMessage?.({ type: 'success', text: successMessage });
      setCreationSummary(null);
      await fetchAbonados();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const startEdit = (abonado: any) => {
    setEditingId(abonado._id);
    setEditVehiculos(Array.isArray(abonado.vehiculos) && abonado.vehiculos.length ? abonado.vehiculos : [{ patente: '', modelo: '', categoria: '', activo: true }]);
    setEditAccesos(Array.isArray(abonado.accesos) && abonado.accesos.length ? abonado.accesos : [{ tipo: 'manual', valor: '', descripcion: '', activo: true }]);
    setEditObservaciones(abonado.observaciones || '');
    setEditFechaVencimiento(abonado.fechaVencimiento ? String(abonado.fechaVencimiento).slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/v2/abonados/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehiculos: editVehiculos.filter((v) => v.patente.trim()),
          accesos: editAccesos.filter((a) => a.valor.trim()),
          observaciones: editObservaciones,
          fechaVencimiento: editFechaVencimiento || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
      setMessage('Abonado actualizado correctamente.');
      ownerOperations?.setStatusMessage?.({ type: 'success', text: 'Abonado actualizado correctamente.' });
      setCreationSummary(null);
      setEditingId(null);
      await fetchAbonados();
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    }
  };

  const updateVehiculo = (index: number, patch: Partial<Vehiculo>) => setVehiculos((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const updateAcceso = (index: number, patch: Partial<Acceso>) => setAccesos((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  const updateEditVehiculo = (index: number, patch: Partial<Vehiculo>) => setEditVehiculos((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const updateEditAcceso = (index: number, patch: Partial<Acceso>) => setEditAccesos((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  const goToExistingAbonado = (numeroAbonado?: number | null) => {
    if (!numeroAbonado) return;
    setSearch(String(numeroAbonado));
    setAbonadoSearchMode('numeroAbonado');
    setTabIndex(0);
  };

  return (
    <div className="space-y-6">
      <div className="dashboard-section p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Abonados</h2>
            <p className="mt-1 text-sm text-gray-500">Gestión comercial y operativa de abonados. El alta quedó como flujo secundario.</p>
          </div>
          {clientsNavigation ? (
            <button
              onClick={() => clientsNavigation.goToUsers()}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Ir a Usuarios
            </button>
          ) : null}
        </div>
      </div>

      {inlineStatusEnabled && message ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div> : null}
      {inlineStatusEnabled && error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {creationSummary ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <p className="font-semibold">Resumen de alta</p>
          <p><strong>Abonado:</strong> {creationSummary.clientName || '-'}</p>
          <p><strong>Nro abonado:</strong> {creationSummary.numeroAbonado ?? '-'}</p>
          {creationSummary.initialInvoice ? (
            <>
              <p><strong>Documento inicial:</strong> {creationSummary.initialInvoice.invoiceCode || '-'}</p>
              <p><strong>Estado documento:</strong> {creationSummary.initialInvoice.estado || '-'}</p>
              <p><strong>Monto:</strong> ${Number(creationSummary.initialInvoice.monto || 0).toFixed(2)}</p>
              <p><strong>Método de pago:</strong> {creationSummary.initialInvoice.paymentMethod || '-'}</p>
              <p><strong>Referencia:</strong> {creationSummary.initialInvoice.paymentReference || '-'}</p>
            </>
          ) : (
            <p><strong>Cobro inicial:</strong> no se emitió documento inicial en esta alta.</p>
          )}
        </div>
      ) : null}

      <div className="dashboard-section p-5 md:p-6">
        <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
          <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>Listado y gestión</Tab>
            <Tab className={({ selected }) => classNames('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition', selected ? 'border-gray-300 bg-gray-200 text-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>Alta de abonado</Tab>
          </Tab.List>

          <Tab.Panels className="mt-6">
            <Tab.Panel className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Abonados registrados</h3>
                  <p className="mt-1 text-sm text-gray-500">Gestión operativa del cliente suscripto. La facturación vive en el módulo Facturación.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar abonado" className="rounded-xl border border-gray-300 px-4 py-3" />
                  <select value={abonadoSearchMode} onChange={(e) => setAbonadoSearchMode(e.target.value as 'all' | 'numeroAbonado' | 'dni' | 'nombre' | 'email')} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="all">Buscar en todos</option><option value="numeroAbonado">Nro abonado</option><option value="dni">DNI</option><option value="nombre">Nombre / apellido</option><option value="email">Email</option></select>
                  <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="">Todos los estados</option><option value="activo">Activo</option><option value="suspendido">Suspendido</option><option value="vencido">Vencido</option></select>
                </div>
              </div>

              {!filteredAbonados.length ? <p className="text-sm text-gray-500">No hay abonados para los filtros seleccionados.</p> : <div className="space-y-3">{filteredAbonados.map((a) => <div key={a._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="space-y-1"><p><strong>Nro abonado:</strong> {a.numeroAbonado ?? '-'}</p><p><strong>Cliente:</strong> {(a.nombre || '') + ' ' + (a.apellido || '')}</p><p><strong>DNI:</strong> {a.dni || '-'}</p><p><strong>Estado:</strong> {a.estado}</p><p><strong>Plan:</strong> {a.tarifaNombre || '-'}</p><p><strong>Tipo base:</strong> {a.billingMode || '-'}</p><p><strong>Importe base:</strong> ${Number(a.importeBase || 0).toFixed(2)}</p><p><strong>Vencimiento:</strong> {a.fechaVencimiento ? new Date(a.fechaVencimiento).toLocaleDateString() : '-'}</p><p><strong>Vehículos:</strong> {Array.isArray(a.vehiculos) ? a.vehiculos.map((v: any) => v.patente).join(', ') || '-' : '-'}</p><p><strong>Accesos:</strong> {Array.isArray(a.accesos) ? a.accesos.map((x: any) => `${x.tipo}:${x.valor}`).join(', ') || '-' : '-'}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => void updateEstado(a._id, 'activo')} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Activar</button><button onClick={() => void updateEstado(a._id, 'suspendido')} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">Suspender</button><button onClick={() => void updateEstado(a._id, 'vencido')} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Vencer</button><button onClick={() => startEdit(a)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Editar</button></div></div>{editingId === a._id ? (<div className="mt-4 space-y-4 rounded-2xl border border-gray-200 bg-white p-4"><div><div className="mb-2 flex items-center justify-between"><label className="block text-sm font-semibold text-gray-700">Vehículos autorizados</label><button type="button" onClick={() => setEditVehiculos((prev) => [...prev, { patente: '', modelo: '', categoria: '', activo: true }])} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">+ Vehículo</button></div><div className="space-y-3">{editVehiculos.map((v, index) => <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4"><input value={v.patente} onChange={(e) => updateEditVehiculo(index, { patente: e.target.value })} placeholder="Patente" className="rounded-xl border border-gray-300 px-4 py-3" /><input value={v.modelo || ''} onChange={(e) => updateEditVehiculo(index, { modelo: e.target.value })} placeholder="Modelo" className="rounded-xl border border-gray-300 px-4 py-3" /><input value={v.categoria || ''} onChange={(e) => updateEditVehiculo(index, { categoria: e.target.value })} placeholder="Categoría" className="rounded-xl border border-gray-300 px-4 py-3" /><button type="button" onClick={() => setEditVehiculos((prev) => prev.filter((_, i) => i !== index || prev.length === 1))} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">Quitar</button></div>)}</div></div><div><div className="mb-2 flex items-center justify-between"><label className="block text-sm font-semibold text-gray-700">Medios de acceso</label><button type="button" onClick={() => setEditAccesos((prev) => [...prev, { tipo: 'manual', valor: '', descripcion: '', activo: true }])} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">+ Acceso</button></div><div className="space-y-3">{editAccesos.map((x, index) => <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4"><select value={x.tipo} onChange={(e) => updateEditAcceso(index, { tipo: e.target.value as Acceso['tipo'] })} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="manual">Manual</option><option value="qr">QR</option><option value="rfid">RFID</option><option value="otro">Otro</option></select><input value={x.valor} onChange={(e) => updateEditAcceso(index, { valor: e.target.value })} placeholder="Código / identificador" className="rounded-xl border border-gray-300 px-4 py-3" /><input value={x.descripcion || ''} onChange={(e) => updateEditAcceso(index, { descripcion: e.target.value })} placeholder="Descripción" className="rounded-xl border border-gray-300 px-4 py-3" /><button type="button" onClick={() => setEditAccesos((prev) => prev.filter((_, i) => i !== index || prev.length === 1))} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">Quitar</button></div>)}</div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-gray-700">Fecha de vencimiento</label><input type="date" value={editFechaVencimiento} onChange={(e) => setEditFechaVencimiento(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3" /></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">Observaciones</label><textarea value={editObservaciones} onChange={(e) => setEditObservaciones(e.target.value)} className="min-h-[52px] w-full rounded-xl border border-gray-300 px-4 py-3" /></div></div><div className="flex flex-wrap gap-2"><button onClick={() => void saveEdit()} className="rounded-xl border border-gray-300 bg-gray-200 px-4 py-2.5 font-semibold text-gray-800 hover:bg-gray-300">Guardar cambios</button><button onClick={() => setEditingId(null)} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button></div></div>) : null}</div>)}</div>}
            </Tab.Panel>

            <Tab.Panel className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Alta de abonado</h3>
                <p className="mt-1 text-sm text-gray-500">Flujo secundario para convertir un cliente existente en abonado y asignarle plan, vehículos y accesos.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Buscar cliente</label>
                    <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar cliente" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Buscar por</label>
                    <select value={clientSearchMode} onChange={(e) => setClientSearchMode(e.target.value as 'all' | 'dni' | 'nombre' | 'email')} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
                      <option value="all">Todos</option>
                      <option value="dni">DNI</option>
                      <option value="nombre">Nombre / apellido</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  {!filteredClients.length ? (
                    <p className="text-sm text-gray-500">No se encontraron clientes con ese criterio.</p>
                  ) : filteredClients.map((c) => {
                    const existingAbonado = abonadosByClientId[String(c._id)];
                    const commercialStatus = c.commercialStatus;
                    return (
                    <div
                      key={c._id}
                      role="button"
                      tabIndex={existingAbonado ? -1 : 0}
                      onClick={() => !existingAbonado && setClientId(c._id)}
                      onKeyDown={(event) => {
                        if (existingAbonado) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setClientId(c._id);
                        }
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${clientId === c._id ? 'border-gray-400 bg-white text-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'} ${existingAbonado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold">{(c.nombre || '') + ' ' + (c.apellido || '')}</p>
                          <p className="text-xs text-gray-500">DNI: {c.dni || '-'} · Email: {c.email || '-'} · Tel: {c.telefono || '-'}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {commercialStatus?.hasAbonado ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                                  Ya abonado #{commercialStatus.numeroAbonado ?? '-'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    goToExistingAbonado(commercialStatus.numeroAbonado ?? null);
                                  }}
                                  className="rounded-full border border-gray-300 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                  Ver abonado
                                </button>
                              </div>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                                Disponible para alta
                              </span>
                            )}
                            {Number(commercialStatus?.pendingDocuments ?? 0) > 0 ? (
                              <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-800">
                                Pendientes: {commercialStatus?.pendingDocuments} · ${Number(commercialStatus?.pendingAmount ?? 0).toFixed(2)}
                              </span>
                            ) : null}
                            {commercialStatus?.abonadoEstado ? (
                              <span className="rounded-full bg-gray-200 px-2 py-1 font-semibold text-gray-700">
                                Estado abonado: {commercialStatus.abonadoEstado}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              </div>

              {selectedClient ? <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"><p><strong>Cliente:</strong> {(selectedClient.nombre || '') + ' ' + (selectedClient.apellido || '')}</p><p><strong>DNI:</strong> {selectedClient.dni || '-'}</p><p><strong>Teléfono:</strong> {selectedClient.telefono || '-'}</p><p><strong>Email:</strong> {selectedClient.email || '-'}</p><p><strong>Vehículo base:</strong> {selectedClient.patenteVehiculo || '-'} {selectedClient.modeloVehiculo ? `· ${selectedClient.modeloVehiculo}` : ''}</p></div> : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Playa / parking</label>
                  <select value={assignedParking} onChange={(e) => setAssignedParking(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <option value="">Selecciona una playa</option>
                    {(parkings || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Tarifa mensual</label>
                  <select value={tarifaMensualId} onChange={(e) => setTarifaMensualId(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
                    <option value="">Selecciona tarifa mensual</option>
                    {tarifasMensuales.map((t: any) => {
                      const mensual = t.tarifaMensual?.[0];
                      const amount = Number(mensual?.precioTotal ?? mensual?.precioConDescuento ?? mensual?.precioUnitario ?? 0);
                      return <option key={t._id} value={t._id}>{t.category} · ${amount.toFixed(2)}</option>;
                    })}
                  </select>
                </div>
              </div>

              {tarifaMensualSeleccionada ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p><strong>Plan:</strong> {tarifaMensualSeleccionada.category} · mensual</p>
                  <p><strong>Importe base:</strong> ${Number(tarifaMensualSeleccionada.tarifaMensual?.[0]?.precioTotal ?? tarifaMensualSeleccionada.tarifaMensual?.[0]?.precioConDescuento ?? tarifaMensualSeleccionada.tarifaMensual?.[0]?.precioUnitario ?? 0).toFixed(2)}</p>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between"><label className="block text-sm font-semibold text-gray-700">Vehículos autorizados</label><button type="button" onClick={() => setVehiculos((prev) => [...prev, { patente: '', modelo: '', categoria: '', activo: true }])} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">+ Vehículo</button></div>
                <div className="space-y-3">{vehiculos.map((v, index) => <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4"><input value={v.patente} onChange={(e) => updateVehiculo(index, { patente: e.target.value })} placeholder="Patente" className="rounded-xl border border-gray-300 px-4 py-3" /><input value={v.modelo || ''} onChange={(e) => updateVehiculo(index, { modelo: e.target.value })} placeholder="Modelo" className="rounded-xl border border-gray-300 px-4 py-3" /><input value={v.categoria || ''} onChange={(e) => updateVehiculo(index, { categoria: e.target.value })} placeholder="Categoría" className="rounded-xl border border-gray-300 px-4 py-3" /><button type="button" onClick={() => setVehiculos((prev) => prev.filter((_, i) => i !== index || prev.length === 1))} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">Quitar</button></div>)}</div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><label className="block text-sm font-semibold text-gray-700">Medios de acceso</label><button type="button" onClick={() => setAccesos((prev) => [...prev, { tipo: 'manual', valor: '', descripcion: '', activo: true }])} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">+ Acceso</button></div>
                <div className="space-y-3">{accesos.map((a, index) => <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4"><select value={a.tipo} onChange={(e) => updateAcceso(index, { tipo: e.target.value as Acceso['tipo'] })} className="rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="manual">Manual</option><option value="qr">QR</option><option value="rfid">RFID</option><option value="otro">Otro</option></select><input value={a.valor} onChange={(e) => updateAcceso(index, { valor: e.target.value })} placeholder="Código / identificador" className="rounded-xl border border-gray-300 px-4 py-3" /><input value={a.descripcion || ''} onChange={(e) => updateAcceso(index, { descripcion: e.target.value })} placeholder="Descripción" className="rounded-xl border border-gray-300 px-4 py-3" /><button type="button" onClick={() => setAccesos((prev) => prev.filter((_, i) => i !== index || prev.length === 1))} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100">Quitar</button></div>)}</div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-gray-700">Tipo de facturación base</label><select value={tipoFacturacion} onChange={(e) => setTipoFacturacion(e.target.value as 'mensual' | 'diaria' | 'hora')} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="mensual">Mensual</option><option value="diaria">Diaria</option><option value="hora">Por hora</option></select></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">Fecha de vencimiento</label><input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3" /></div></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">Observaciones</label><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="min-h-[52px] w-full rounded-xl border border-gray-300 px-4 py-3" /></div>

              <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={chargeNow} onChange={(e) => setChargeNow(e.target.checked)} />
                  Cobrar abono inicial ahora
                </label>

                {chargeNow ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Monto a cobrar</label>
                      <input value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} placeholder="Monto" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Método de pago</label>
                      <select value={chargePaymentMethod} onChange={(e) => setChargePaymentMethod(e.target.value as 'efectivo' | 'tarjeta' | 'qr' | 'otros')} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="qr">QR</option><option value="otros">Otros</option></select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Referencia</label>
                      <input value={chargePaymentReference} onChange={(e) => setChargePaymentReference(e.target.value)} placeholder="Referencia de pago" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
                    </div>
                  </div>
                ) : null}
              </div>

              <button onClick={() => void handleCreate()} disabled={loading} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300">{loading ? (chargeNow ? 'Creando y cobrando abonado...' : 'Creando abonado...') : (chargeNow ? 'Crear abonado y cobrar' : 'Crear abonado')}</button>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
