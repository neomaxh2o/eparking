'use client';
import React, { useState, useEffect } from 'react';
import { ITarifa, TarifaHora, TarifaDia, TarifaMensual, TarifaLibre, Categoria } from '@/interfaces/Tarifa/tarifa';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import { useParkings as useParkingsModule } from '@/modules/parking/hooks/useParkings';
import ParkingSelector from '@/app/components/Parking/Tarifas/ParkingSelector';
import TipoTarifaSelector from '@/app/components/AdminPanel/Tarifas/AdminTarifas/TipoTarifaSelector';
import TarifaForm from '@/app/components/AdminPanel/Tarifas/AdminTarifas/TarifaForm';
import AccionesTarifa from '@/app/components/AdminPanel/Tarifas/AdminTarifas/AccionesTarifa';
import MensajeDeEstado from '@/app/components/AdminPanel/Tarifas/AdminTarifas/MensajeDeEstado';

interface AdminTarifasProps {
  tarifaParaEditar?: ITarifa | null;
  onCancelar?: () => void;
  onGuardar?: (tarifa: ITarifa) => void;
}

export default function AdminTarifas({ tarifaParaEditar, onCancelar }: AdminTarifasProps) {
  const { parkings, loading: loadingParkings, error: errorParkings } = useParkingsModule();
  const { fetchTarifas, addOrUpdateTarifa, loading: loadingTarifas, error: errorTarifas } = useTarifas();

  const [selectedParkingId, setSelectedParkingId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [habilitarTarifaHora, setHabilitarTarifaHora] = useState(false);
  const [habilitarTarifaPorDia, setHabilitarTarifaPorDia] = useState(false);
  const [habilitarTarifaMes, setHabilitarTarifaMes] = useState(false);
  const [habilitarTarifaLibre, setHabilitarTarifaLibre] = useState(false);

  const [tarifasHora, setTarifasHora] = useState<TarifaHora[]>([
    { tipoEstadia: 'hora', cantidad: 1, precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 },
  ]);

  const [tarifasDia, setTarifasDia] = useState<TarifaDia[]>([
    { tipoEstadia: 'dia', cantidad: 1, precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 },
  ]);

  const [tarifasMes, setTarifasMes] = useState<TarifaMensual[]>([
    { tipoEstadia: 'mensual', cantidad: 1, precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 },
  ]);

  const [tarifasLibre, setTarifasLibre] = useState<TarifaLibre[]>([
    { tipoEstadia: 'libre', precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 },
  ]);

  const [categoria, setCategoria] = useState<Categoria>('Automóvil');

  useEffect(() => {
    fetchTarifas();

    if (tarifaParaEditar) {
      setSelectedParkingId(tarifaParaEditar.parkinglotId);
      setHabilitarTarifaHora(!!tarifaParaEditar.tarifasHora?.length);
      setHabilitarTarifaPorDia(!!tarifaParaEditar.tarifasPorDia?.length);
      setHabilitarTarifaMes(!!tarifaParaEditar.tarifaMensual?.length);
      setHabilitarTarifaLibre(!!tarifaParaEditar.tarifaLibre?.length);

      setTarifasHora(tarifaParaEditar.tarifasHora || []);
      setTarifasDia(tarifaParaEditar.tarifasPorDia || []);
      setTarifasMes(tarifaParaEditar.tarifaMensual || []);
      setTarifasLibre(tarifaParaEditar.tarifaLibre || []);
    }
  }, [tarifaParaEditar, fetchTarifas]);

  const validarCampos = (): boolean => {
    if (!selectedParkingId) return false;
    return habilitarTarifaHora || habilitarTarifaPorDia || habilitarTarifaMes || habilitarTarifaLibre;
  };

  const handleSubmit = async () => {
    if (!selectedParkingId) {
      setErrorMsg('Debes seleccionar un estacionamiento antes de guardar.');
      return;
    }

    if (!validarCampos()) {
      setErrorMsg('No hay tarifas habilitadas para guardar.');
      return;
    }

    setErrorMsg(null);

    try {
      if (habilitarTarifaHora && tarifasHora.length > 0) {
        await addOrUpdateTarifa(selectedParkingId, categoria, 'hora', tarifasHora);
      }
      if (habilitarTarifaPorDia && tarifasDia.length > 0) {
        await addOrUpdateTarifa(selectedParkingId, categoria, 'dia', tarifasDia);
      }
      if (habilitarTarifaMes && tarifasMes.length > 0) {
        await addOrUpdateTarifa(selectedParkingId, categoria, 'mensual', tarifasMes);
      }
      if (habilitarTarifaLibre && tarifasLibre.length > 0) {
        await addOrUpdateTarifa(selectedParkingId, categoria, 'libre', tarifasLibre);
      }

      await fetchTarifas();
      setSuccessMsg('Tarifas procesadas correctamente');

      setTarifasHora([{ tipoEstadia: 'hora', cantidad: 1, precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 }]);
      setTarifasDia([{ tipoEstadia: 'dia', cantidad: 1, precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 }]);
      setTarifasMes([{ tipoEstadia: 'mensual', cantidad: 1, precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 }]);
      setTarifasLibre([{ tipoEstadia: 'libre', precioUnitario: 0, bonificacionPorc: 0, precioConDescuento: 0, precioTotal: 0 }]);

      setHabilitarTarifaHora(false);
      setHabilitarTarifaPorDia(false);
      setHabilitarTarifaMes(false);
      setHabilitarTarifaLibre(false);
    } catch (err) {
      console.error('Error procesando tarifas:', err);
      setErrorMsg('Ocurrió un error al procesar las tarifas.');
    }
  };

  return (
    <div className="dashboard-section mx-auto max-w-4xl p-5 md:p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Administrar Tarifas</h2>
        <p className="mt-1 text-sm text-gray-500">Configuración tarifaria por parking, categoría y modalidad de cobro.</p>
      </div>

      {errorParkings ? <p className="text-sm text-red-600">Error cargando estacionamientos: {errorParkings}</p> : null}
      {errorTarifas ? <p className="text-sm text-red-600">Error procesando tarifas: {errorTarifas}</p> : null}

      <ParkingSelector
        parkings={parkings}
        selectedParkingId={selectedParkingId}
        onChange={setSelectedParkingId}
        loading={loadingParkings}
        label="Selecciona un estacionamiento"
      />

      <TipoTarifaSelector
        categoria={categoria}
        setCategoria={setCategoria}
        habilitarTarifaHora={habilitarTarifaHora}
        setHabilitarTarifaHora={setHabilitarTarifaHora}
        habilitarTarifaPorDia={habilitarTarifaPorDia}
        setHabilitarTarifaPorDia={setHabilitarTarifaPorDia}
        habilitarTarifaMes={habilitarTarifaMes}
        setHabilitarTarifaMes={setHabilitarTarifaMes}
        habilitarTarifaLibre={habilitarTarifaLibre}
        setHabilitarTarifaLibre={setHabilitarTarifaLibre}
      />

      {habilitarTarifaHora && <TarifaForm<TarifaHora> mode="hora" tarifas={tarifasHora} setTarifas={setTarifasHora} habilitar />}
      {habilitarTarifaPorDia && <TarifaForm<TarifaDia> mode="dia" tarifas={tarifasDia} setTarifas={setTarifasDia} habilitar />}
      {habilitarTarifaMes && <TarifaForm<TarifaMensual> mode="mensual" tarifas={tarifasMes} setTarifas={setTarifasMes} habilitar />}
      {habilitarTarifaLibre && <TarifaForm<TarifaLibre> mode="libre" tarifas={tarifasLibre} setTarifas={setTarifasLibre} habilitar />}

      <AccionesTarifa onGuardar={handleSubmit} loading={loadingTarifas} />

      {errorMsg ? <p className="text-sm font-semibold text-red-600">{errorMsg}</p> : null}
      <MensajeDeEstado successMsg={successMsg} error={errorTarifas} />
    </div>
  );
}
