import { apiClient } from '@/shared/api/client';
import type { TicketLookupResponse } from '@/shared/api/contracts/tickets';

type LegacyTicketResponse = {
  _id?: string;
  ticketNumber?: string;
  estado?: string;
  horaEntrada?: string | null;
  horaExpiracion?: string | null;
  patente?: string | null;
  categoria?: string | null;
  metodoPago?: string | null;
  totalCobrado?: number | null;
};

function mapLegacyTicketToDto(input: LegacyTicketResponse): TicketLookupResponse {
  return {
    id: String(input._id ?? input.ticketNumber ?? ''),
    ticket_code: String(input.ticketNumber ?? ''),
    status: String(input.estado ?? 'unknown'),
    issued_at: input.horaEntrada ?? undefined,
    vehicle_plate: input.patente ?? undefined,
    parking_name: undefined,
    category: input.categoria ?? undefined,
    payment_method: input.metodoPago ?? undefined,
    total_charged:
      typeof input.totalCobrado === 'number' ? input.totalCobrado : undefined,
    expires_at: input.horaExpiracion ?? undefined,
  };
}

export async function fetchTicketByCode(code: string): Promise<TicketLookupResponse> {
  const response = await apiClient<LegacyTicketResponse>(`/api/caja/ticket/${encodeURIComponent(code)}`);
  return mapLegacyTicketToDto(response);
}
