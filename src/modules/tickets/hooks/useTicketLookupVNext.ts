import { useState } from 'react';
import type { TicketLookupResponse } from '@/shared/api/contracts/tickets';
import { fetchTicketByCode } from '@/modules/tickets/lib';

export function useTicketLookupVNext() {
const [data, setData] = useState<TicketLookupResponse | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

async function lookup(code: string) {
setLoading(true);
setError(null);

try {
const res = await fetchTicketByCode(code);
setData(res);
return res;
} catch (err) {
const msg = err instanceof Error ? err.message : 'Unknown error';
setError(msg);
throw err;
} finally {
setLoading(false);
}
}

return { data, loading, error, lookup };
}
