'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import PaymentCheckIn from '@/app/components/Payments/PaymentCheckIn';
import { ReservationExtended } from '@/interfaces/reservations';

interface ReservationModalProps {
  reservation: ReservationExtended;
  users: any[];
  userRole?: string;
  onClose: () => void;
  onProcess: (id: string) => void;
  onPaymentUpdated: (updated: ReservationExtended) => void;
}

export default function ReservationModal({
  reservation,
  users,
  userRole,
  onClose,
  onProcess,
  onPaymentUpdated,
}: ReservationModalProps) {
  const operator = users.find(u => u._id === reservation.processedBy);
  const operatorName = operator?.name || reservation.processedBy;

  const needsPayment = reservation.status === 'confirmed' && (!reservation.amountPaid || reservation.amountPaid === 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-3xl w-[95%] relative overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={24} />
        </button>

        <h3 className="text-2xl font-bold mb-4">
          Reserva de {reservation.nombre} {reservation.apellido}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
          <div>
            <h4 className="font-semibold mb-2 border-b border-gray-200 pb-1">Datos Personales</h4>
            <p><strong>DNI:</strong> {reservation.dni}</p>
            <p><strong>Teléfono:</strong> {reservation.telefono}</p>
            <p><strong>Ciudad:</strong> {reservation.ciudad}</p>
            <p><strong>Domicilio:</strong> {reservation.domicilio}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2 border-b border-gray-200 pb-1">Detalles de la Reserva</h4>
            <p><strong>Checkin:</strong> {new Date(reservation.startTime).toLocaleString()}</p>
            <p><strong>Checkout:</strong> {new Date(reservation.endTime).toLocaleString()}</p>
            <p><strong>Forma de Pago:</strong> {reservation.formaPago}</p>
            <p><strong>Estado de Pago:</strong> {needsPayment ? 'Pendiente' : 'Pagado'}</p>
            {reservation.processedBy && <p><strong>Procesado por:</strong> {operatorName}</p>}
          </div>

          <div>
            <h4 className="font-semibold mb-2 border-b border-gray-200 pb-1">Vehículo</h4>
            <p><strong>Categoría:</strong> {reservation.categoriaVehiculo || 'No especificado'}</p>
            <p><strong>Patente:</strong> {reservation.patenteVehiculo || 'N/A'}</p>
            <p><strong>Modelo:</strong> {reservation.modeloVehiculo || 'N/A'}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2 border-b border-gray-200 pb-1">Montos y Tiempo</h4>
            <p><strong>Días:</strong> {reservation.cantidadDias ?? 'N/A'}</p>
            <p><strong>Monto Pagado:</strong> ${reservation.amountPaid?.toFixed(2) ?? '0.00'}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(userRole === 'owner' || userRole === 'operator') && reservation.status === 'pending' && (
            <button
              onClick={() => onProcess(reservation._id)}
              className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              <Check size={16} /> Procesar Reserva
            </button>
          )}

          {(userRole === 'owner' || userRole === 'operator') && needsPayment && (
            <PaymentCheckIn
              reservation={reservation}
              onPaymentUpdated={onPaymentUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
