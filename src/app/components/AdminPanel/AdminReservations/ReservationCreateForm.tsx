'use client';

import { useState, useEffect } from 'react';
import { useParkingLots } from '@/app/hooks/Parking/useParkingLots';
import { useTarifas } from '@/app/hooks/Parking/useTarifas';
import { categoriasArray, Categoria } from '@/constants/categorias';
import { useReservations } from '@/app/hooks/Reservations/useReservations';
import { useSession } from 'next-auth/react';
import { useUsers } from '@/app/hooks/Users/useUsers';

export default function ReservationCreateForm() {
  const { data: session } = useSession();
  const userId = session?.user?.id || '';

  const { parkings, loading: loadingLots } = useParkingLots();
  const { users, loading: loadingUsers } = useUsers();
  const { tarifas, loading: loadingTarifas } = useTarifas('');
  const { createReservation, loading: loadingCreate } = useReservations();

  const [form, setForm] = useState({
    parkingLot: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    ciudad: '',
    domicilio: '',
    patenteVehiculo: '',
    modeloVehiculo: '',
    formaPago: '',
    categoriaVehiculo: '' as Categoria | '',
    cantidadDias: 1,
    startTime: '',
    endTime: '',
    amountPaid: 0,
  });

  const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const selectedUser = users.find(u => u._id === clientId);

    if (selectedUser) {
      setForm(prev => ({
        ...prev,
        nombre: (selectedUser as any).nombre || '',
        apellido: (selectedUser as any).apellido || '',
        dni: (selectedUser as any).dni || '',
        telefono: (selectedUser as any).telefono || '',
        ciudad: (selectedUser as any).ciudad || '',
        domicilio: (selectedUser as any).domicilio || '',
        patenteVehiculo: (selectedUser as any).patenteVehiculo || '',
        modeloVehiculo: (selectedUser as any).modeloVehiculo || '',
        categoriaVehiculo: (selectedUser as any).categoriaVehiculo || '',
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'amountPaid' ? parseFloat(value) || 0 : value,
    }));
  };

  useEffect(() => {
    if (form.startTime && form.endTime) {
      const start = new Date(form.startTime);
      const end = new Date(form.endTime);
      if (end > start) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        setForm(prev => ({ ...prev, cantidadDias: Math.ceil(diffDays) }));
      }
    }
  }, [form.startTime, form.endTime]);

  const handleCotizar = () => {
    if (!form.parkingLot || !form.categoriaVehiculo || form.cantidadDias < 1) return;

    const tarifa = tarifas.find(t => t.category === form.categoriaVehiculo);
    if (!tarifa) return;

    const tarifasPorDiaSorted = [...tarifa.tarifasPorDia].sort((a, b) => a.day - b.day);
    let tarifaDia = tarifasPorDiaSorted[0];
    for (const tpd of tarifasPorDiaSorted) {
      if (tpd.day <= form.cantidadDias) tarifaDia = tpd;
      else break;
    }

    let precioBase = tarifaDia.price * form.cantidadDias;
    if (tarifaDia.discountPercent) {
      precioBase -= (precioBase * tarifaDia.discountPercent) / 100;
    }

    setForm(prev => ({ ...prev, amountPaid: precioBase }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoriaVehiculo || !form.parkingLot) return;

    const reservationPayload = {
      user: userId,
      parkingLot: form.parkingLot,
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      telefono: form.telefono,
      ciudad: form.ciudad,
      domicilio: form.domicilio,
      patenteVehiculo: form.patenteVehiculo,
      modeloVehiculo: form.modeloVehiculo,
      categoriaVehiculo: form.categoriaVehiculo,
      formaPago: form.formaPago,
      cantidadDias: form.cantidadDias,
      startTime: form.startTime,
      endTime: form.endTime,
      amountPaid: form.amountPaid,
    };

    try {
      const success = await createReservation(reservationPayload);
      if (success) {
        setForm({
          parkingLot: '',
          nombre: '',
          apellido: '',
          dni: '',
          telefono: '',
          ciudad: '',
          domicilio: '',
          patenteVehiculo: '',
          modeloVehiculo: '',
          formaPago: '',
          categoriaVehiculo: '',
          cantidadDias: 1,
          startTime: '',
          endTime: '',
          amountPaid: 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dashboard-section mx-auto max-w-4xl p-5 md:p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Crear Reserva</h2>
        <p className="mt-1 text-sm text-gray-500">Carga operativa de reservas con cotización y datos completos.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Playa de Estacionamiento</label>
        {loadingLots ? (
          <p className="text-sm text-gray-500">Cargando playas...</p>
        ) : (
          <select name="parkingLot" value={form.parkingLot} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500">
            <option value="">-- Selecciona una playa --</option>
            {parkings?.map(lot => (
              <option key={lot._id} value={lot._id}>{lot.name}</option>
            ))}
          </select>
        )}
      </div>

      {(session?.user?.role === 'owner' || session?.user?.role === 'operator') && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Seleccionar Cliente</label>
          {loadingUsers ? (
            <p className="text-sm text-gray-500">Cargando clientes...</p>
          ) : (
            <select onChange={handleSelectClient} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500">
              <option value="">-- Selecciona un cliente --</option>
              {users.filter(u => u.role === 'client').map(u => (
                <option key={u._id} value={u._id}>{(u as any).nombre} {(u as any).apellido} ({u.email})</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
        <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
        <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
        <input name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
        <input name="domicilio" placeholder="Domicilio" value={form.domicilio} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <select name="categoriaVehiculo" value={form.categoriaVehiculo} onChange={handleChange} required className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          <option value="" disabled>-- Categoría Vehículo --</option>
          {categoriasArray.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input name="patenteVehiculo" placeholder="Patente" value={form.patenteVehiculo} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
        <input name="modeloVehiculo" placeholder="Modelo" value={form.modeloVehiculo} onChange={handleChange} required className="rounded-xl border border-gray-300 px-4 py-3" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <select name="formaPago" value={form.formaPago} onChange={handleChange} required className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          <option value="" disabled>-- Forma de pago --</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="mercadoPago">Mercado Pago</option>
        </select>
        <input type="number" step="0.01" name="amountPaid" placeholder="Monto pagado" value={form.amountPaid} onChange={handleChange} className="rounded-xl border border-gray-300 px-4 py-3" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Fecha y hora ingreso</label>
          <input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-3" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Fecha y hora salida</label>
          <input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required className="w-full rounded-xl border border-gray-300 px-4 py-3" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Cantidad de días</label>
        <input type="number" name="cantidadDias" value={form.cantidadDias} readOnly className="w-full cursor-not-allowed rounded-xl border border-gray-300 bg-gray-100 px-4 py-3" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button type="button" onClick={handleCotizar} disabled={loadingTarifas || loadingLots} className="rounded-xl border border-gray-300 bg-white py-3 font-semibold text-gray-700 hover:bg-gray-50">
          Cotizar
        </button>
        <button type="submit" disabled={loadingCreate || loadingLots} className="rounded-xl border border-gray-300 bg-gray-200 py-3 font-semibold text-gray-800 hover:bg-gray-300">
          Crear Reserva
        </button>
      </div>
    </form>
  );
}
