'use client';
import React, { useState } from 'react';
import { useEstadias } from '@/app/hooks/Parking/Caja/useEstadias';
import EditTicket from './EditTicket';
import { ITarifa } from '@/interfaces/Tarifa/tarifa';
import { TicketData } from '@/interfaces/Estadias/ticket';

interface ConfigurarEstadiasProps {
  tarifas: ITarifa[];
}

const ConfigurarEstadias: React.FC<ConfigurarEstadiasProps> = ({ tarifas }) => {
  const { estadias, loading, refresh } = useEstadias();

  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Buscar ticket en el array de estadías
  const handleBuscarTicket = () => {
    const ticket = estadias.find(e => e.ticketNumber === ticketNumber);
    if (!ticket) {
      alert('No se encontró el ticket');
      return;
    }

    setSelectedTicket(ticket as TicketData);
    setIsModalOpen(true);
  };

  const handleGuardar = (updatedTicket: TicketData) => {
    console.log('Ticket actualizado:', updatedTicket);
    // Aquí podés llamar a la API para actualizar en DB si querés
    refresh();
  };

  if (loading) return <p>Cargando estadías...</p>;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Configurar Estádias</h2>

      <input
        type="text"
        placeholder="Número de Ticket"
        className="border p-2 w-full rounded"
        value={ticketNumber}
        onChange={e => setTicketNumber(e.target.value)}
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleBuscarTicket}
        disabled={!ticketNumber}
      >
        Editar Ticket
      </button>

      {selectedTicket && (
  <EditTicket
    nombreEstacionamiento="Nombre del estacionamiento" // reemplazá por el nombre real que quieras
    ticketData={selectedTicket}                        // acá usás el ticket seleccionado
    tarifas={tarifas}
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleGuardar}
    refresh={refresh}
  />
)}

    </div>
  );
};

export default ConfigurarEstadias;
