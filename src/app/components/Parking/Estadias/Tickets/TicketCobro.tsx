'use client';
import React from 'react';
import TicketUI from '@/app/components/Parking/Estadias/UI/TicketUI'; // ✅ corregido
import { IEstadia } from '@/interfaces/Estadias/estadias';
import { SubTarifa } from '@/interfaces/Tarifa/tarifa';

interface TicketCobroProps {
  estadia: IEstadia;
  tarifa: SubTarifa;
  montoCobrado: number;
  nombreEstacionamiento: string;
  operatorName: string;
}

const TicketCobro: React.FC<TicketCobroProps> = ({
  estadia,
  tarifa,
  montoCobrado,
  nombreEstacionamiento,
  operatorName,
}) => {
  const qrData = {
    ticket: estadia.ticket,
    patente: estadia.patente,
    categoria: estadia.categoria,
    tipoEstadia: tarifa.tipoEstadia,
    monto: montoCobrado,
    entrada: estadia.horaEntrada,
    salida: estadia.horaSalida || new Date().toISOString(),
  };

  return (
    <TicketUI
      ticket={estadia.ticket}
      patente={estadia.patente}
      categoria={estadia.categoria}
      tipoEstadia={tarifa.tipoEstadia}
      horaEntrada={estadia.horaEntrada}
      horaSalida={estadia.horaSalida || new Date().toISOString()}
      precioUnitario={tarifa.precioUnitario}
      totalCobrado={montoCobrado}
      metodoPago={estadia.metodoPago}
      operatorName={operatorName}
      nombreEstacionamiento={nombreEstacionamiento}
      qrData={qrData}
    />
  );
};

export default TicketCobro;
