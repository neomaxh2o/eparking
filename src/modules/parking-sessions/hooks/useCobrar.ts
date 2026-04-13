import { useState } from 'react';

interface CobrarPayload {
  ticketNumber: string;
  metodoPago?: 'efectivo' | 'tarjeta' | 'qr' | 'otros';
  prepago?: boolean;
  categoria?: string;
  tipoEstadia?: 'hora' | 'dia' | string;
  patente?: string;
  tarifaId?: string;
  totalCobrado?: number;
  detalleCobro?: string;
  horaSalida?: string;
  cantidadHoras?: number;
  cantidadDias?: number;
}

interface TicketResponse {
  ticketNumber: string;
  patente?: string;
  categoria?: string;
  operadorId?: string;
  cliente?: any;
  horaEntrada?: string;
  horaSalida?: string;
  totalCobrado?: number;
  tipoEstadia?: string;
  cantidadHoras?: number;
  cantidadDias?: number;
  tarifaId?: string;
  tarifaBaseHora?: number;
  tarifa?: number;
  metodoPago?: string;
  estado?: string;
  prepago?: boolean;
  detalleCobro?: string;
}

export function useCobrar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketResponse | null>(null);

  const cobrar = async (payload: CobrarPayload) => {
    setLoading(true);
    setError(null);
    setTicket(null);

    try {
      const res = await fetch('/api/estadia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al cobrar');
        setLoading(false);
        return;
      }

      setTicket(data.ticket);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('❌ Error en useCobrar:', err);
      setError('Error de red');
      setLoading(false);
    }
  };

  return { cobrar, loading, error, ticket };
}
