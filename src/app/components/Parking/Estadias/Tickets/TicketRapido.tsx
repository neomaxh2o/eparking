'use client';

import React from 'react';
import TicketUI from '@/app/components/Parking/Estadias/UI/TicketUI';
import { CategoriaVehiculo } from '@/interfaces/user';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface TicketRapidoProps {
  nombreEstacionamiento: string;
  operatorName: string;
  parkingName: string;
  ticketNumber: string;
  horaEntrada: string; // ISO string
  patente?: string;
  categoria?: CategoriaVehiculo;
}

const TicketRapido: React.FC<TicketRapidoProps> = ({
  nombreEstacionamiento,
  operatorName,
  parkingName,
  ticketNumber,
  horaEntrada,
  patente = 'SIN PATENTE',
  categoria = 'Automóvil',
}) => {
  // Convertimos la hora a Argentina y mantenemos ISO string
  const horaLocal = dayjs.utc(horaEntrada).tz('America/Argentina/Buenos_Aires');

  console.log('TicketRapido props recibidas:', {
    nombreEstacionamiento,
    operatorName,
    parkingName,
    ticketNumber,
    horaEntrada,
    horaLocal: horaLocal.format('DD/MM/YYYY HH:mm:ss'),
    patente,
    categoria,
  });

  return (
    <TicketUI
      ticket={ticketNumber}
      patente={patente}
      categoria={categoria}
      tipoEstadia="libre"
      horaEntrada={horaLocal.toISOString()} // siempre ISO
      operatorName={operatorName}
      parkingName={parkingName}
      qrData={{
        ticket: ticketNumber,
        patente,
        categoria,
        tipoEstadia: 'libre',
        entrada: horaLocal.toISOString(),
      }}
    />
  );
};

export default TicketRapido;
