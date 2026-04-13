/**
 * @deprecated Use `@/modules/tickets/lib` directly or a module-level ticket hook.
 * Legacy compatibility layer. Do not use in new code.
 */
import { useState } from 'react';
import { fetchTicketByCode } from '@/modules/tickets/lib';
import type { TicketLookupResponse } from '@/shared/api/contracts/tickets';

export function useQuickTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketLookupResponse | null>(null);

  async function lookup(ticketCode: string) {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTicketByCode(ticketCode);
      setTicket(data);
      return data;
    } catch (err: any) {
      const message = err?.message || 'Error buscando ticket';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error, ticket };
}
