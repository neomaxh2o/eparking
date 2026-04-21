type TurnoTicketViewModel = {
  ticketId: string;
  ticketNumber?: string;
  estado: string;
  total?: number;
  totalCobrado?: number;
  paymentMethod?: string;
};

export type TurnoViewModel = {
  turnoId: string;
  caja: {
    cajaId?: string;
    cajaCode?: string;
    numero?: number;
    esAdministrativa: boolean;
  };
  operador: {
    operatorId?: string;
    operatorName?: string;
    operatorEmail?: string;
  };
  tickets: TurnoTicketViewModel[];
  totalCobrado: number;
  totalEsperado: number;
  flags: {
    isOpen: boolean;
    isClosed: boolean;
    isPending: boolean;
    hasTickets: boolean;
  };
  actions: {
    canView: boolean;
    canClose: boolean;
    canLiquidate: boolean;
    canRegisterPayment: boolean;
  };
  openedAt?: string;
  raw?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toTicketViewModel(value: unknown): TurnoTicketViewModel | null {
  const raw = asRecord(value);
  if (!raw) return null;

  return {
    ticketId: String(raw._id ?? raw.ticketId ?? raw.id ?? ''),
    ticketNumber: asString(raw.ticketNumber) ?? asString(raw.code),
    estado: String(raw.estado ?? raw.status ?? 'desconocido'),
    total: asNumber(raw.total),
    totalCobrado: asNumber(raw.totalCobrado) ?? asNumber(raw.total),
    paymentMethod: asString(raw.paymentMethod) ?? asString(raw.metodoPago),
  };
}

export function adaptTurnoFromLegacy(turnoRaw: unknown): TurnoViewModel | null {
  const raw = asRecord(turnoRaw);
  if (!raw) return null;

  const estadoRaw = String(raw.estado ?? raw.state ?? '').trim().toLowerCase();
  const tickets = Array.isArray(raw.tickets)
    ? raw.tickets.map(toTicketViewModel).filter((ticket): ticket is TurnoTicketViewModel => Boolean(ticket))
    : [];

  const totalCobrado = asNumber(raw.totalCobrado) ?? asNumber(raw.totalTurno) ?? 0;
  const totalEsperado = tickets.reduce((acc, ticket) => acc + (ticket.total ?? ticket.totalCobrado ?? 0), 0);
  const isOpen = estadoRaw === 'abierto' || estadoRaw === 'en_curso' || (!estadoRaw && Boolean(raw.fechaApertura) && !raw.fechaCierre);
  const isClosed = estadoRaw === 'cerrado' || estadoRaw === 'liquidado';
  const isPending = estadoRaw === 'pendiente' || estadoRaw === 'pendiente_liquidacion';

  return {
    turnoId: String(raw._id ?? raw.turnoId ?? raw.id ?? ''),
    caja: {
      cajaId: asString(raw.cajaId) ?? asString(raw.caja_id),
      cajaCode: asString(raw.cajaCode) ?? asString(raw.codigoCaja),
      numero: asNumber(raw.numeroCaja) ?? asNumber(raw.cajaNumero) ?? asNumber(raw.numero),
      esAdministrativa: Boolean(raw.esCajaAdministrativa),
    },
    operador: {
      operatorId: asString(raw.operatorId) ?? asString(raw.operadorId),
      operatorName: asString(raw.operatorName) ?? asString(raw.operadorNombre),
      operatorEmail: asString(raw.operatorEmail) ?? asString(raw.operadorEmail),
    },
    tickets,
    totalCobrado,
    totalEsperado,
    flags: {
      isOpen,
      isClosed,
      isPending,
      hasTickets: tickets.length > 0,
    },
    actions: {
      canView: true,
      canClose: isOpen,
      canLiquidate: isOpen || isPending,
      canRegisterPayment: isOpen,
    },
    openedAt: asString(raw.fechaApertura),
    raw,
  };
}
