'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(form.email);
  const isPasswordValid = form.password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (result?.error) {
      setError('Credenciales incorrectas. Verifica correo y contraseña.');
    } else {
      setError('');
      const session = await getSession();
      const role = session?.user?.role;

      if (role === 'client') {
        router.push('/abonados');
      } else if (role === 'owner' || role === 'admin') {
        router.push('/parking/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="dashboard-section p-6 md:p-8 space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
            <Lock className="h-5 w-5 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-500">
            Accede al panel operativo con tus credenciales.
          </p>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Correo electrónico</label>
          <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all ${!isEmailValid && form.email ? 'border-red-400' : 'border-gray-300'} focus-within:border-gray-500`}>
            <Mail className="h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full border-0 bg-transparent outline-none"
            />
          </div>
          {!isEmailValid && form.email ? (
            <p className="text-xs text-red-500">Ingresa un correo válido.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
          <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all ${!isPasswordValid && form.password ? 'border-red-400' : 'border-gray-300'} focus-within:border-gray-500`}>
            <Lock className="h-4 w-4 text-gray-400" />
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full border-0 bg-transparent outline-none"
            />
          </div>
          {!isPasswordValid && form.password ? (
            <p className="text-xs text-red-500">La contraseña debe tener al menos 6 caracteres.</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading || !isEmailValid || !isPasswordValid}
          className={`w-full rounded-xl border border-gray-300 bg-gray-200 py-3 font-semibold text-gray-800 transition hover:bg-gray-300 ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
