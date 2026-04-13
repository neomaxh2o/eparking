'use client';

import { useState } from 'react';
import { useRegisterUser } from '@/app/hooks/Users/useRegisterUser';
import { categoriasArray } from '@/constants/categorias';
import { UserPlus, Mail, Lock, User, Car } from 'lucide-react';
import { Transition } from '@headlessui/react';

interface UserRegisterFormProps {
  forcedRole?: 'client' | 'owner' | 'admin' | 'guest';
}

export default function UserRegisterForm({ forcedRole }: UserRegisterFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: forcedRole ?? 'client',
    assignedParking: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    ciudad: '',
    domicilio: '',
    patenteVehiculo: '',
    modeloVehiculo: '',
    categoriaVehiculo: '',
  });
  const { register, loading, error, response } = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form, role: forcedRole ?? form.role };
    await register(payload);
  };

  const isClient = (forcedRole ?? form.role) === 'client';

  return (
    <form onSubmit={handleSubmit} className="dashboard-section max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {forcedRole === 'client' ? 'Registro de Cliente' : 'Registro de Usuario'}
      </h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      {response && <p className="text-green-600 text-center">✓ {response.message} <br /> Rol: <strong>{response.role}</strong></p>}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-2"><UserPlus size={20} /> Credenciales</h3>
        <div className={`grid grid-cols-1 gap-4 ${forcedRole ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          <div className="flex items-center gap-2 border rounded-xl p-3 focus-within:border-gray-500"><User className="text-gray-400" /><input type="text" placeholder="Nombre Usuario" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full outline-none" /></div>
          <div className="flex items-center gap-2 border rounded-xl p-3 focus-within:border-gray-500"><Mail className="text-gray-400" /><input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full outline-none" /></div>
          <div className="flex items-center gap-2 border rounded-xl p-3 focus-within:border-gray-500"><Lock className="text-gray-400" /><input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full outline-none" /></div>
          {!forcedRole ? (
            <div className="flex items-center gap-2 border rounded-xl p-3 focus-within:border-gray-500"><UserPlus className="text-gray-400" /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full outline-none"><option value="client">Cliente</option><option value="owner">Manager</option><option value="admin">Administrador</option><option value="guest">Guest</option></select></div>
          ) : null}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-2"><UserPlus size={20} /> Datos Personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="border p-3 rounded-xl w-full"/>
          <input type="text" placeholder="Apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} className="border p-3 rounded-xl w-full"/>
          <input type="text" placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} className="border p-3 rounded-xl w-full"/>
          <input type="text" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="border p-3 rounded-xl w-full"/>
          <input type="text" placeholder="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className="border p-3 rounded-xl w-full"/>
          <input type="text" placeholder="Domicilio" value={form.domicilio} onChange={(e) => setForm({ ...form, domicilio: e.target.value })} className="border p-3 rounded-xl w-full"/>
        </div>
      </div>

      <Transition show={isClient} enter="transition-all duration-500 ease-out" enterFrom="opacity-0 max-h-0" enterTo="opacity-100 max-h-[600px]" leave="transition-all duration-300 ease-in" leaveFrom="opacity-100 max-h-[600px]" leaveTo="opacity-0 max-h-0" className="overflow-hidden">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-2"><Car size={20} /> Datos del Vehículo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Patente" value={form.patenteVehiculo} onChange={(e) => setForm({ ...form, patenteVehiculo: e.target.value })} className="border p-3 rounded-xl w-full"/>
            <input type="text" placeholder="Modelo" value={form.modeloVehiculo} onChange={(e) => setForm({ ...form, modeloVehiculo: e.target.value })} className="border p-3 rounded-xl w-full"/>
            <select value={form.categoriaVehiculo} onChange={(e) => setForm({ ...form, categoriaVehiculo: e.target.value })} className="border p-3 rounded-xl w-full"><option value="">-- Categoría --</option>{categoriasArray.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select>
          </div>
        </div>
      </Transition>

      <button type="submit" disabled={loading} className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 font-semibold text-gray-800 hover:bg-gray-300 transition flex justify-center items-center gap-2">
        {loading ? <span className="animate-pulse">Registrando...</span> : forcedRole === 'client' ? 'Registrar Cliente' : 'Registrar Usuario'}
      </button>
    </form>
  );
}
