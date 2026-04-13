'use client';

import { categoriasArray } from '@/constants/categorias';
import { FormValues } from '@/types/abonados';
import { useParkingLots } from '@/app/hooks/Parking/useParkingLots';

interface Props {
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
  parkings?: { _id: string; name: string }[];
}

export default function DatosVehiculo({ form, setForm }: Props) {
  const { parkings, loading, error } = useParkingLots();

  return (
    <div className="bg-gray-50 p-4 rounded border space-y-4">
      <h3 className="font-semibold text-gray-700 mb-2">Datos del Vehículo</h3>
      {loading && <p>Cargando parkings...</p>}
      {error && <p className="text-red-500">Error cargando parkings: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patente */}
        <div>
          <label className="block text-sm font-medium mb-1">Patente</label>
          <input
            type="text"
            placeholder="Patente"
            value={form.patenteVehiculo ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, patenteVehiculo: e.target.value }))}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Modelo */}
        <div>
          <label className="block text-sm font-medium mb-1">Modelo</label>
          <input
            type="text"
            placeholder="Modelo"
            value={form.modeloVehiculo ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, modeloVehiculo: e.target.value }))}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            value={form.categoriaVehiculo ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, categoriaVehiculo: e.target.value }))}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Selecciona categoría --</option>
            {categoriasArray.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Parking asignado */}
        <div>
          <label className="block text-sm font-medium mb-1">Parking Asignado</label>
          <select
            value={form.assignedParking ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, assignedParking: e.target.value }))}
            className="border p-2 rounded w-full"
            disabled={loading || !parkings?.length}
          >
            <option value="">-- Selecciona parking --</option>
            {parkings?.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
