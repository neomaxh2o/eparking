'use client';

import { FormValues } from '@/types/abonados';

interface Props {
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
  generarPassword: () => void;
}

export default function CredencialesUsuario({ form, setForm, generarPassword }: Props) {
  return (
    <div className="bg-gray-50 p-4 rounded border space-y-4">
      <h3 className="font-semibold text-gray-700 mb-2">Credenciales de Usuario</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Nombre Usuario"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="border p-2 rounded w-full"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="border p-2 rounded w-full"
        />

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="border p-2 rounded w-full"
          />
          <button
            type="button"
            onClick={generarPassword}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
          >
            🔑
          </button>
        </div>
      </div>
    </div>
  );
}
