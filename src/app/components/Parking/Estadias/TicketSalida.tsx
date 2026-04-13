'use client';
import React, { useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import JsBarcode from 'jsbarcode';
import { SalidaData } from '@/app/hooks/Parking/Caja/useSalida';
import { describeCommercialUnit } from '@/modules/caja/server/commercial';

export interface TicketSalidaProps {
  ticket: SalidaData;
  nombreEstacionamiento: string;
  operatorName: string;
  parkingName: string;
}

const TicketSalida: React.FC<TicketSalidaProps> = ({
  ticket,
  nombreEstacionamiento,
  operatorName,
  parkingName
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  // Generar código de barras solo si existe ticketNumber
  useEffect(() => {
    if (barcodeRef.current && ticket.ticketNumber) {
      JsBarcode(barcodeRef.current, ticket.ticketNumber, {
        format: 'CODE128',
        width: 1.2,
        height: 50,
        displayValue: true,
        font: 'monospace',
        textMargin: 5
      });
    }
  }, [ticket.ticketNumber]);

  const separator = '--------------------------------';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 320,
        padding: 10,
        border: '1px solid #000',
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: '#fff'
      }}
    >
      <h3 style={{ textAlign: 'center', margin: '5px 0' }}>{nombreEstacionamiento}</h3>
      <p style={{ textAlign: 'center', margin: '2px 0' }}>{separator}</p>

      <div style={{ width: '100%', marginBottom: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Ticket:</span>
          <span>{ticket.ticketNumber ?? '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Patente:</span>
          <span>{ticket.patente || 'SIN PATENTE'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Categoría:</span>
          <span>{ticket.categoria || '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tipo comercial:</span>
          <span>{describeCommercialUnit(ticket)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Hora Entrada:</span>
          <span>{ticket.horaEntrada ? new Date(ticket.horaEntrada).toLocaleString() : '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Hora Salida:</span>
          <span>{ticket.horaSalida ? new Date(ticket.horaSalida).toLocaleString() : '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tarifa Base:</span>
          <span>${(ticket.tarifaBaseHora ?? 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Cobrado:</span>
          <span>${(ticket.totalCobrado ?? 0).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Método Pago:</span>
          <span>{ticket.metodoPago || '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Doc. Billing:</span>
          <span>{ticket.billingDocumentCode || 'PENDIENTE'}</span>
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

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 10
        }}
      >
        {ticket.ticketNumber && (
          <QRCode value={ticket.ticketNumber} size={120} style={{ marginBottom: 10 }} />
        )}
        <svg
          ref={barcodeRef}
          style={{ width: '100%', maxWidth: 280, height: 50, display: 'block' }}
        />
      </div>

      <p style={{ textAlign: 'center', margin: '5px 0', fontSize: 12 }}>{separator}</p>
      <p style={{ textAlign: 'center', fontSize: 12 }}>¡Gracias por su visita!</p>
    </div>
  );
};

export default TicketSalida;
