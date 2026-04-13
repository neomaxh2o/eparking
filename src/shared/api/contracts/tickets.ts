export type TicketDto = {
  id: string;
  ticket_code: string;
  status: string;
  issued_at?: string;
  vehicle_plate?: string | null;
  parking_name?: string | null;
  category?: string | null;
  payment_method?: string | null;
  total_charged?: number | null;
  expires_at?: string | null;
};

export type TicketLookupResponse = TicketDto;
