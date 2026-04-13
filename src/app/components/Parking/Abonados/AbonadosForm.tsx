'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CredencialesUsuario,
  DatosPersonales,
  DatosVehiculo,
} from './AbonadosForm/blocks/index';
import { FormValues } from '@/types/abonados';
import { useParkingLots } from '@/app/hooks/Parking/useParkingLots';
import SubscriptionManager from './AbonadosForm/blocks/SubscriptionsForm/SubscriptionManager';

interface AbonadosFormProps {
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
  handleSubmit: (
    form: FormValues
  ) => Promise<{ success: boolean; userId?: string; message?: string; role?: string }>;
  loading: boolean;
  error: string | null;
  response?: any;
}

const stepsLabels = ['Usuario', 'Personales', 'Vehículo', 'Alta Servicio'];

export default function AbonadosForm({
  form,
  setForm,
  handleSubmit,
  loading,
  error,
  response,
}: AbonadosFormProps) {
  const [step, setStep] = useState<number>(1);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const { parkings } = useParkingLots();

  const generarPassword = () => {
    const randomPass = Math.random().toString(36).slice(-10);
    setForm({ ...form, password: randomPass });
  };

  const isStepValid = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return form.name?.trim() && form.email?.trim() && form.password?.trim();
      case 2:
        return (
          form.nombre?.trim() &&
          form.apellido?.trim() &&
          form.dni?.trim() &&
          form.telefono?.trim() &&
          form.ciudad?.trim() &&
          form.domicilio?.trim()
        );
      case 3:
        return (
          form.patenteVehiculo?.trim() &&
          form.modeloVehiculo?.trim() &&
          form.categoriaVehiculo?.trim() &&
          form.assignedParking?.trim()
        );
      default:
        return false;
    }
  };

  const nextStep = async () => {
    if (!isStepValid(step)) return alert('Completa todos los campos requeridos antes de continuar.');

    if (step === 3 && !registeredUserId) {
      const result = await handleSubmit(form);
      if (!result.success) return alert(result.message || 'Error al registrar usuario');
      setRegisteredUserId(result.userId || null);
      setResponseMessage(result.message || 'Usuario registrado correctamente');
      setStep(4);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const stepComponents = [
    <CredencialesUsuario key="step1" form={form} setForm={setForm} generarPassword={generarPassword} />,
    <DatosPersonales key="step2" form={form} setForm={setForm} />,
    <DatosVehiculo key="step3" form={form} setForm={setForm} parkings={parkings ?? []} />,
    registeredUserId && (
      <SubscriptionManager key="step4" userId={registeredUserId} />
    ),
  ];

  const progressPercent = ((step - 1) / (stepsLabels.length - 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Registro de Abonado</h2>

      <div className="mb-8">
        <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-2 bg-green-500"
            style={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm font-medium text-gray-700">
          {stepsLabels.map((label, index) => {
            const completed = isStepValid(index + 1);
            return (
              <span key={label} className="flex items-center gap-1">
                {label} {completed && <span className="text-green-500 font-bold">✔</span>}
              </span>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}
      {responseMessage && <p className="text-green-600 text-center">{responseMessage}</p>}

      <AnimatePresence mode="wait">
        {stepComponents.map((Component, index) =>
          index + 1 === step ? (
            <motion.div
              key={index}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {Component}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        {step > 1 && step <= 3 && (
          <button type="button" onClick={prevStep} className="px-4 py-2 rounded bg-gray-400 text-white">
            Anterior
          </button>
        )}
        {step <= 3 && (
          <button
            type="button"
            onClick={nextStep}
            disabled={loading || !isStepValid(step)}
            className={`px-4 py-2 rounded text-white ${
              loading || !isStepValid(step) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {step === 3 ? (loading ? 'Registrando...' : 'Registrar Abonado') : 'Siguiente'}
          </button>
        )}
      </div>
    </div>
  );
}
