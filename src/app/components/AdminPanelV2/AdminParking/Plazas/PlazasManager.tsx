'use client';

import React, { useState, useEffect } from 'react';
import { usePlazas } from '@/app/hooks/Estadias/usePlazas';
import { Plaza, SubPlaza, Segmentacion } from '@/interfaces/Plaza/Plaza';
import { useEstadiasContext } from '@/app/context/EstadiasContext';

export default function PlazasManager() {
  const {
    plazas,
    loading,
    error,
    createPlaza,
    updatePlaza,
    deletePlaza,
    saveSubPlaza,
    deleteSubPlaza,
  } = usePlazas();

  const { parkings } = useEstadiasContext();

  const [editingPlaza, setEditingPlaza] = useState<Plaza | null>(null);

  // Campos para crear/editar
  const [selectedParking, setSelectedParking] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<'mensual' | 'hora' | 'dia' | 'libre'>('hora');
  const [subPlazasCount, setSubPlazasCount] = useState(1);
  const [desde, setDesde] = useState(1);
  const [hasta, setHasta] = useState(1);

  // ------------------- DEBUG -------------------
  useEffect(() => {
    console.log('Plazas desde hook usePlazas:', plazas);
    console.log('Parkings desde context:', parkings);
  }, [plazas, parkings]);
  // --------------------------------------------

  // ------------------- HANDLERS -------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParking) {
      console.error('Debe seleccionar un parking');
      return;
    }

    const plazasFisicas: SubPlaza[] = Array.from(
      { length: hasta - desde + 1 },
      (_, i) => ({
        numero: desde + i,
        estado: 'disponible',
        ocupada: false,
        configurable: true,
        usuarioAbonado: null,
        estadiaId: null,
        notas: '',
      })
    );

    const segmentaciones: Segmentacion[] = [
      {
        categoria,
        desde,
        hasta,
        plazas: plazasFisicas,
      },
    ];

    const payload: Partial<Plaza> = {
      nombre: name,
      descripcion,
      plazasFisicas,
      segmentaciones,
      parkinglotId: selectedParking,
    };

    console.log('Payload a enviar:', payload);

    try {
      if (editingPlaza) {
        await updatePlaza(editingPlaza._id, payload);
        setEditingPlaza(null);
      } else {
        await createPlaza(payload);
      }
    } catch (err) {
      console.error('Error en handleSubmit:', err);
    }

    // Reset
    setName('');
    setDescripcion('');
    setCategoria('hora');
    setSubPlazasCount(1);
    setDesde(1);
    setHasta(1);
    setSelectedParking(null);
  };

  const handleEdit = (plaza: Plaza) => {
    setEditingPlaza(plaza);
    setName(plaza.nombre);
    setDescripcion(plaza.descripcion || '');
    setCategoria(plaza.segmentaciones?.[0]?.categoria || 'hora');
    setSubPlazasCount(plaza.plazasFisicas.length);
    if (plaza.segmentaciones?.length) {
      setDesde(plaza.segmentaciones[0].desde);
      setHasta(plaza.segmentaciones[0].hasta);
    }
    setSelectedParking(plaza.parkinglotId || null);
  };

  const handleDelete = async (id: string) => {
    await deletePlaza(id);
  };
  // ----------------------------------------------

  // ------------------- Totales generales -------------------
  const totalGeneral = plazas.reduce(
    (acc, plaza) => {
      const total = plaza.plazasFisicas.length;
      const disponibles = plaza.plazasFisicas.filter(
        (sub) => sub.estado === 'disponible' && !sub.ocupada
      ).length;
      const ocupadas = total - disponibles;
      acc.total += total;
      acc.disponibles += disponibles;
      acc.ocupadas += ocupadas;
      return acc;
    },
    { total: 0, disponibles: 0, ocupadas: 0 }
  );
  // ------------------------------------------------------------

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gestión de Plazas</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4 p-4 border rounded-lg shadow">
        <div>
          <label className="block mb-1">Seleccionar Parking</label>
          <select
            value={selectedParking ?? ''}
            onChange={(e) => setSelectedParking(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          >
            <option value="" disabled>-- Seleccione un parking --</option>
            {parkings?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name ?? String(p._id)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Nombre de la playa/cochera</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as any)}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="mensual">Mensual</option>
            <option value="hora">Hora</option>
            <option value="dia">Día</option>
            <option value="libre">Libre</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <div>
            <label className="block mb-1">Desde N° Plaza</label>
            <input
              type="number"
              value={desde}
              onChange={(e) => setDesde(Number(e.target.value))}
              min={1}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Hasta N° Plaza</label>
            <input
              type="number"
              value={hasta}
              onChange={(e) => setHasta(Number(e.target.value))}
              min={desde}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          {editingPlaza ? 'Actualizar Plaza' : 'Crear Plaza'}
        </button>
      </form>

      {loading && <p>Cargando plazas...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {plazas.map((plaza) => {
        const totalPlazas = plaza.plazasFisicas.length;
        const disponibles = plaza.plazasFisicas.filter(
          (sub) => sub.estado === 'disponible' && !sub.ocupada
        ).length;
        const ocupadas = totalPlazas - disponibles;

        // Mapear número de subplaza a su categoría según segmentaciones
        const subPlazaCategorias: Record<number, string> = {};
        if (plaza.segmentaciones?.length) {
          plaza.segmentaciones.forEach((seg) => {
            for (let n = seg.desde; n <= seg.hasta; n++) {
              subPlazaCategorias[n] = seg.categoria;
            }
          });
        }

        // Categoría de nivel superior
        const categoriaPlaza = plaza.categoria;

        return (
          <div key={plaza._id} className="mb-6 border rounded-lg p-4 shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg">
                {plaza.nombre} ({categoriaPlaza}) — {totalPlazas} plazas / {disponibles} disponibles / {ocupadas} ocupadas
              </h2>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(plaza)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(plaza._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Borrar
                </button>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">N° Plaza</th>
                  <th className="border p-2">Categoría</th>
                  <th className="border p-2">Estado</th>
                  <th className="border p-2">Usuario Abonado</th>
                                    <th className="border p-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {plaza.plazasFisicas.map((sub) => (
                  <tr key={sub.numero}>
                    <td className="border p-2">{sub.numero}</td>
                    <td className="border p-2">{subPlazaCategorias[sub.numero] || categoriaPlaza}</td>
                    <td className="border p-2">{sub.estado}</td>
                    <td className="border p-2">
                      {sub.usuarioAbonado
                        ? `${sub.usuarioAbonado.ticketNumber} - ${sub.usuarioAbonado.patente}`
                        : '-'}
                    </td>
                    <td className="border p-2">{sub.notas || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {plazas.length > 0 && (
        <div className="mt-8 p-4 border rounded-lg shadow bg-gray-50">
          <h2 className="text-xl font-bold mb-2">Resumen General</h2>
          <p>Total de plazas: <strong>{totalGeneral.total}</strong></p>
          <p>Disponibles: <strong>{totalGeneral.disponibles}</strong></p>
          <p>Ocupadas: <strong>{totalGeneral.ocupadas}</strong></p>
        </div>
      )}

      {plazas.length === 0 && !loading && <p className="mt-4">No hay categorías de plazas creadas.</p>}
    </div>
  );
}
