'use client';

import { useState } from 'react';
import AbonadosForm from './AbonadosForm';
import { FormValues } from '@/types/abonados';
import { useRegisterUser } from '@/app/hooks/Users/useRegisterUser';

export default function Abonados() {
  const [form, setForm] = useState<FormValues>({
    name: '',
    email: '',
    password: '',
    role: 'client',
    assignedParking: '', // 🔑 unificado
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    ciudad: '',
    domicilio: '',
    patenteVehiculo: '',
    modeloVehiculo: '',
    categoriaVehiculo: '',
    medioAcceso: undefined,
    tipoAbono: undefined,
    fechaAlta: '',
    vigenciaHasta: '',
    tipoPago: undefined,
    tipoTarifa: '',
    idMedioAcceso: '',
    periodoExtension: 0,
  });

  const { register, loading, error, response } = useRegisterUser();

  const handleSubmit = async (formData: FormValues) => {
  console.log('📌 handleSubmit - formData completo:', formData);
  console.log('📌 handleSubmit - assignedParking actual:', formData.assignedParking);

  const payload: any = { ...formData };

  // Solo eliminar assignedParking si está vacío o null
  if (!formData.assignedParking) {
    delete payload.assignedParking;
    console.log('📌 handleSubmit - assignedParking vacío, se eliminará del payload');
  } else {
    console.log('📌 handleSubmit - assignedParking se enviará al API:', formData.assignedParking);
  }

  try {
    await register(payload); // register devuelve void

    console.log('📌 handleSubmit - payload enviado al API:', payload);

    return {
      success: true,
      userId: response?.userId,
      message: response?.message || 'Usuario registrado correctamente',
      role: response?.role || formData.role,
    };
  } catch (err: any) {
    console.error('📌 handleSubmit - error al registrar:', err);
    return {
      success: false,
      message: err.message || 'Error al registrar usuario',
    };
  }
};


  return (
    <AbonadosForm
      form={form}
      setForm={setForm}
      handleSubmit={handleSubmit}
      loading={loading}
      error={error}
      response={response}
    />
  );
}
