'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Modal from './Modal';
import TicketRapido from './Tickets/TicketRapido';
import { useEstadias } from '@/modules/parking-sessions/hooks/useEstadias';
import { useTarifas } from '@/app/hooks/Tarifa/useTarifa';
import { SubTarifa } from '@/interfaces/Tarifa/tarifa';
import { useEstadiasContext } from '@/app/context/EstadiasContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CategoriaVehiculo } from '@/interfaces/user';

dayjs.extend(utc);
dayjs.extend(timezone);

interface AssignedParking { _id: string; name: string; }
export interface OperatorUser { 
  _id: string; 
  name: string; 
  email: string; 
  role: string; 
  assignedParking: AssignedParking; 
  assignedParkingId: string; 
}

const Boton: React.FC<{ nombreEstacionamiento: string; operator: OperatorUser }> = ({ nombreEstacionamiento, operator }) => {
  const { createEstadia } = useEstadias();
  const { getTarifaByCategory } = useTarifas(operator.assignedParking._id);
  const { refresh } = useEstadiasContext(); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState<any | null>(null);

  const handleCrearTicketRapido = useCallback(async () => {
    const tarifaITarifa = getTarifaByCategory('Automóvil');
    const tarifaLibre = tarifaITarifa?.tarifaLibre?.[0];

    if (!tarifaITarifa || !tarifaLibre) {
      console.error('No se encontró tarifa libre');
      return;
    }

    const subTarifa: SubTarifa = {
      ...tarifaLibre,
      _id: tarifaITarifa._id,
      category: tarifaITarifa.category,
      tipoEstadia: 'libre',
    };

    // Hora actual en Argentina
    const horaEntradaArg = dayjs().tz('America/Argentina/Buenos_Aires').toISOString();

    try {
      const result = await createEstadia(
        subTarifa,
        'SIN PATENTE',
        operator._id,
        operator.assignedParking._id,
        horaEntradaArg
      );

      setTicketData({ 
        ticket: result.ticket,
        horaEntrada: horaEntradaArg,
        patente: 'SIN PATENTE',
        categoria: 'Automóvil' as CategoriaVehiculo
      });
      setIsModalOpen(true);
      refresh();
    } catch (err) {
      console.error('Error creando ticket rápido:', err);
    }
  }, [createEstadia, operator, getTarifaByCategory, refresh]);

  // 🔹 Nuevo: disparar con tecla Espacio
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') { 
        e.preventDefault(); // evita que scrollee la página
        handleCrearTicketRapido();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleCrearTicketRapido]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <button
        className="bg-blue-600 text-white w-72 h-72 rounded-3xl text-3xl font-bold flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform shadow-lg"
        onClick={handleCrearTicketRapido}
      >
        Ticket Rápido
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {ticketData && (
          <TicketRapido
            nombreEstacionamiento={nombreEstacionamiento}
            operatorName={operator.name}
            parkingName={operator.assignedParking.name}
            ticketNumber={ticketData.ticket}
            horaEntrada={ticketData.horaEntrada}
            patente={ticketData.patente}
            categoria={ticketData.categoria}
          />
        )}
      </Modal>
    </div>
  );
};

export default Boton;
 