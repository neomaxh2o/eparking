'use client';
import React, { useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import JsBarcode from 'jsbarcode';
import { ITicket } from '@/interfaces/Estadias/ticket';

// TicketUIProps hereda de ITicket para reconocer ticket, patente, categoria, etc.
export interface TicketUIProps extends Partial<ITicket> {
  extraFields?: { label: string; value: string | number }[];
  qrData?: any;
  nombreEstacionamiento?: string; // mantenemos consistencia
}

const separator = '--------------------------------';

const TicketUI: React.FC<TicketUIProps> = ({
  ticket,
  patente,
  categoria,
  tipoEstadia,
  horaEntrada,
  horaSalida,
  precioUnitario,
  totalCobrado,
  metodoPago,
  operatorName,
  nombreEstacionamiento,
  extraFields,
  qrData,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && ticket) {
      JsBarcode(barcodeRef.current, ticket, {
        format: 'CODE128',
        width: 1.2,
        height: 50,
        displayValue: true,
        font: 'monospace',
        textMargin: 5,
      });
    }
  }, [ticket]);

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
        background: '#fff',
      }}
    >
      <h3 style={{ textAlign: 'center', margin: '5px 0' }}>
        {nombreEstacionamiento || 'Estacionamiento'}
      </h3>
      <p style={{ textAlign: 'center', margin: '2px 0' }}>{separator}</p>

      <div style={{ width: '100%', marginBottom: 5 }}>
        {ticket && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ticket:</span>
            <span>{ticket}</span>
          </div>
        )}
        {patente && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Patente:</span>
            <span>{patente}</span>
          </div>
        )}
        {categoria && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Categoría:</span>
            <span>{categoria}</span>
          </div>
        )}
        {tipoEstadia && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tipo Estadia:</span>
            <span>{tipoEstadia}</span>
          </div>
        )}
        {horaEntrada && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Hora Entrada:</span>
            <span>{new Date(horaEntrada).toLocaleString()}</span>
          </div>
        )}
        {horaSalida && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Hora Salida:</span>
            <span>{new Date(horaSalida).toLocaleString()}</span>
          </div>
        )}
        {precioUnitario !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Precio Unitario:</span>
            <span>${precioUnitario.toFixed(2)}</span>
          </div>
        )}
        {totalCobrado !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Cobrado:</span>
            <span>${totalCobrado.toFixed(2)}</span>
          </div>
        )}
        {metodoPago && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Método Pago:</span>
            <span>{metodoPago}</span>
          </div>
        )}
        {operatorName && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Operador:</span>
            <span>{operatorName}</span>
          </div>
        )}
        {extraFields &&
          extraFields.map((field, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{field.label}:</span>
              <span>{field.value}</span>
            </div>
          ))}
      </div>

      <p style={{ textAlign: 'center', margin: '5px 0' }}>{separator}</p>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 10,
        }}
      >
        {qrData && (
          <QRCode value={JSON.stringify(qrData)} size={120} style={{ marginBottom: 10 }} />
        )}
        {ticket && (
          <svg
            ref={barcodeRef}
            style={{ width: '100%', maxWidth: 280, height: 50, display: 'block' }}
          />
        )}
      </div>

      <p style={{ textAlign: 'center', margin: '5px 0', fontSize: 12 }}>{separator}</p>
      <p style={{ textAlign: 'center', fontSize: 12 }}>¡Gracias por su visita!</p>
    </div>
  );
};

export default TicketUI;
