'use client';

import { FormValues } from '@/types/abonados';

interface Props {
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
}

export default function DatosPersonales({ form, setForm }: Props) {
  return (
    <div className="bg-gray-50 p-4 rounded border space-y-4">
      <h3 className="font-semibold text-gray-700 mb-2">Datos Personales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Apellido"
          value={form.apellido}
          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="DNI"
          value={form.dni}
          onChange={(e) => setForm({ ...form, dni: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Ciudad"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Domicilio"
          value={form.domicilio}
          onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
          className="border p-2 rounded w-full"
        />
      </div>
    </div>
  );
}
