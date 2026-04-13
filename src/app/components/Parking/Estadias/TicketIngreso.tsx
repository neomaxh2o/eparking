'use client';
import React, { useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import JsBarcode from 'jsbarcode';
import { calcularTiempoTranscurrido } from '@/app/helpers/fechaHelpers';

interface TicketIngresoProps {
  ticketNumber: string;
  patente: string;
  categoria: string;
  horaEntrada: string | Date;
  tarifaBaseHora: number;
  totalCobrado: number;
  nombreEstacionamiento: string;

  operatorName: string;
  parkingName: string;
}

export const TicketIngreso: React.FC<TicketIngresoProps> = ({
  ticketNumber,
  patente,
  categoria,
  horaEntrada,
  tarifaBaseHora,
  totalCobrado,
  nombreEstacionamiento,
  operatorName,
  parkingName
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, ticketNumber, {
        format: 'CODE128',
        width: 1.2,
        height: 50,
        displayValue: true,
        font: 'monospace',
        textMargin: 5
      });
    }
  }, [ticketNumber]);

  // Convertir horaEntrada a Date si viene como string
  const horaUTC = typeof horaEntrada === 'string' ? new Date(horaEntrada) : horaEntrada;

  // Sumar 3 horas para horario local de Argentina
  const horaLocal = new Date(horaUTC.getTime() + 3 * 60 * 60 * 1000);

  // Formatear la hora
  const horaFormateada = horaLocal.toLocaleString('es-AR', {
    hour12: false,
  });

  // Calcular tiempo transcurrido usando la hora local
  const tiempoArg = calcularTiempoTranscurrido(horaLocal);

  const separator = '--------------------------------';

  return (
    <div style={{
      width: '100%',
      maxWidth: 320,
      padding: 10,
      border: '1px solid #000',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ textAlign: 'center', margin: '5px 0' }}>{nombreEstacionamiento}</h3>
      <p style={{ textAlign: 'center', margin: '2px 0' }}>{separator}</p>

      <div style={{ width: '100%', marginBottom: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Ticket:</span>
          <span>{ticketNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Patente:</span>
          <span>{patente}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Categoría:</span>
          <span>{categoria}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Hora Entrada:</span>
          <span>{horaFormateada}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tiempo transcurrido:</span>
          <span>{`${tiempoArg.horas}h ${tiempoArg.minutos}m ${tiempoArg.segundos}s`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tarifa Base:</span>
          <span>${(tarifaBaseHora ?? 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total a Cobrar:</span>
          <span>${(totalCobrado ?? 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Operador:</span>
          <span>{operatorName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Parking:</span>
          <span>{parkingName}</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', margin: '5px 0' }}>{separator}</p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
        <QRCode value={ticketNumber} size={120} style={{ marginBottom: 10 }} />
        <svg ref={barcodeRef} style={{ width: '100%', maxWidth: 280, height: 50, display: 'block' }} />
      </div>

      <p style={{ textAlign: 'center', margin: '5px 0', fontSize: 12 }}>{separator}</p>
      <p style={{ textAlign: 'center', fontSize: 12 }}>¡Gracias por su visita!</p>
    </div>
  );
};
