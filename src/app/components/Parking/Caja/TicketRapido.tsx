'use client';
import React from 'react';
import { useCheckin, CheckinData, EstadiaResponse } from '@/app/hooks/Parking/Caja/useCheckin';

interface TicketPrintData {
  ticketNumber: string;
  patente: string;
  categoria: string;
  horaEntrada: string;
  tarifaBaseHora: number;
  totalCobrado: number;
}

interface TicketRapidoProps {
  setTicketData: React.Dispatch<React.SetStateAction<TicketPrintData | null>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  operadorId: string;
  playaId: string;
  tarifaId: string; // tarifa default
}

const TicketRapido: React.FC<TicketRapidoProps> = ({
  setTicketData,
  setIsModalOpen,
  operadorId,
  playaId,
  tarifaId
}) => {
  const { createCheckin, loading } = useCheckin();

  const handleGenerarTicketRapido = async () => {
    try {
      // Payload ajustado a CheckinData
      const payload: CheckinData = {
        ticketNumber: `RAP-${Date.now()}`,
        patente: '---',
        categoria: 'Otros',
        tipoEstadia: 'libre',
        tarifaId,
        operadorId,
        playaId
      };

      const data: EstadiaResponse = await createCheckin(payload);

      const ticket: TicketPrintData = {
        ticketNumber: data.ticketNumber,
        patente: data.patente ?? '---',
        categoria: data.categoria,
        horaEntrada: data.horaEntrada,
        tarifaBaseHora: 0,
        totalCobrado: 0
      };

      setTicketData(ticket);
      setIsModalOpen(true);

    } catch (err: any) {
      console.error('Error generando ticket rápido:', err.message);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerarTicketRapido}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? 'Generando...' : 'Generar Ticket Rápido'}
      </button>
    </div>
  );
};

export default TicketRapido;
