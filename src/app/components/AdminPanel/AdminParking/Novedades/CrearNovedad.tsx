'use client';
import React, { useEffect } from 'react';
import { Novedad } from '@/app/hooks/Parking/useNovedades';

interface CrearNovedadProps {
  categoria: string;
  setCategoria: (value: string) => void;
  descripcion: string;
  setDescripcion: (value: string) => void;
  operadores: { _id: string; name: string; assignedParkingId: string | null }[];
  esGlobal: boolean;
  setEsGlobal: (value: boolean) => void;
  parkingSeleccionado: string | null;
  setParkingSeleccionado: (value: string | null) => void;
  parkingsSafe: { _id: string; name: string }[];
  destinatarios: string[];
  setDestinatarios: React.Dispatch<React.SetStateAction<string[]>>;
  userName?: string;
  assignedParkingId?: string;
  crearNovedad: (data: Partial<Novedad>) => Promise<Novedad | null>;
  role: 'owner' | 'operator' | 'client';
}

export default function CrearNovedad({
  categoria,
  setCategoria,
  descripcion,
  setDescripcion,
  operadores,
  esGlobal,
  setEsGlobal,
  parkingSeleccionado,
  setParkingSeleccionado,
  parkingsSafe,
  destinatarios,
  setDestinatarios,
  userName,
  assignedParkingId,
  crearNovedad,
  role
}: CrearNovedadProps) {

  // Inicializamos parkingSeleccionado para owners automáticamente
  useEffect(() => {
    if (role === 'owner' && (parkingsSafe ?? []).length > 0 && !parkingSeleccionado) {
      setParkingSeleccionado((parkingsSafe ?? [])[0]._id);
    }
  }, [role, parkingsSafe, parkingSeleccionado, setParkingSeleccionado]);

  const handleDestinatarioChange = (userId: string) => {
    setDestinatarios(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // parkingId a enviar
  const parkingIdToSend =
    categoria === 'Mensajes'
      ? esGlobal
        ? undefined
        : parkingSeleccionado ?? undefined
      : assignedParkingId;

  const handleGuardar = async () => {
    if (!descripcion.trim()) {
      alert('Por favor, escribí la descripción de la novedad.');
      return;
    }

    if (categoria === 'Mensajes') {
      if (!esGlobal && (destinatarios.length === 0 && !parkingSeleccionado)) {
        alert('Seleccioná al menos un destinatario, un parking o marcá como mensaje global.');
        return;
      }
    }

    try {
      await crearNovedad({
        title: categoria,
        category: categoria,
        description: descripcion.trim(),
        date: new Date().toISOString(),
        parkingId: parkingIdToSend,
        author: userName ?? undefined,
        recipients: categoria === 'Mensajes' && !esGlobal ? destinatarios : undefined,
        isGlobal: categoria === 'Mensajes' ? esGlobal : undefined,
      });

      // Reset
      setDescripcion('');
      setCategoria('Turnos');
      setDestinatarios([]);
      setEsGlobal(false);
      if (role === 'owner' && (parkingsSafe ?? []).length > 0) {
        setParkingSeleccionado((parkingsSafe ?? [])[0]._id);
      } else {
        setParkingSeleccionado(null);
      }
    } catch (error) {
      alert('Error guardando la novedad.');
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-md">
      {/* Categoría */}
      <label className="block mb-2 font-medium text-gray-700">Categoría</label>
      <select
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
      >
        {['Turnos','Estadías','Administración','Caja','Otros','Mensajes'].map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Descripción */}
      <label className="block mb-2 font-medium text-gray-700">Descripción</label>
      <textarea
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 resize-none"
        rows={4}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      {/* Input visual */}
      <label className="block mb-2 font-medium text-gray-700">ParkingId a enviar</label>
      <input
        type="text"
        value={parkingIdToSend ?? 'null'}
        readOnly
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 bg-gray-100"
      />

      {/* Selector de parkings para owner */}
      {role === 'owner' && (
        <div className="mb-4">
          <label className="block font-medium mb-2">Seleccioná el parking:</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            value={parkingSeleccionado || ''}
            onChange={(e) => setParkingSeleccionado(e.target.value)}
          >
            {(parkingsSafe ?? []).map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Destinatarios de Mensajes */}
      {categoria === 'Mensajes' && (
        <div className="mb-4 border border-gray-300 rounded p-4 bg-white">
          <label className="block font-medium mb-2">Destino del mensaje:</label>

          <div className="mb-2 flex flex-col md:flex-row gap-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                checked={esGlobal}
                onChange={() => { setEsGlobal(true); setDestinatarios([]); }}
                className="mr-2"
              />
              Mensaje global
            </label>

            {!esGlobal && (
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!esGlobal}
                  onChange={() => { setEsGlobal(false); }}
                  className="mr-2"
                />
                Seleccionar operadores
              </label>
            )}
          </div>

          {!esGlobal && (
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
              {(operadores ?? [])
                .filter(op => role === 'owner' ? op.assignedParkingId === parkingSeleccionado : true)
                .map(op => (
                  <label key={op._id} className="block cursor-pointer">
                    <input
                      type="checkbox"
                      checked={destinatarios.includes(op._id)}
                      onChange={() => handleDestinatarioChange(op._id)}
                      className="mr-2"
                    />
                    {op.name}
                  </label>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleGuardar}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
      >
        Guardar
      </button>
    </div>
  );
}
