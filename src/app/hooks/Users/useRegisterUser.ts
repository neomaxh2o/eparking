import { useState } from 'react';

export type UserRole = 'client' | 'owner' | 'operator' | 'admin' | 'guest';

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  assignedParking?: string;

  // Campos extendidos
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  patenteVehiculo?: string;
  modeloVehiculo?: string;
  categoriaVehiculo?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
  role?: string;
}

export function useRegisterUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RegisterResponse | null>(null);

  const register = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error desconocido');
      }

      setResponse({
        success: true,
        message: json.message,
        userId: json.userId,
        role: json.role,
      });
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error, response };
}
