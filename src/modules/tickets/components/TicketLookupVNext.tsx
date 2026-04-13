'use client';

import { useState } from 'react';
import { useTicketLookupVNext } from '@/modules/tickets/hooks/useTicketLookupVNext';

export default function TicketLookupVNext() {
const [code, setCode] = useState('');
const { data, loading, error, lookup } = useTicketLookupVNext();

return (
<div className="p-4 space-y-4">
<h1 className="text-xl font-semibold">Ticket Lookup vNext</h1>

<div className="flex gap-2">
<input
className="border rounded px-3 py-2 w-full"
placeholder="Código de ticket"
value={code}
onChange={(e) => setCode(e.target.value)}
/>
<button
className="rounded bg-black text-white px-4 py-2"
onClick={() => lookup(code)}
disabled={loading || !code}
>
Buscar
</button>
</div>

{loading && <div>Cargando ticket...</div>}
{error && <div className="text-red-600">Error: {error}</div>}

{data && (
<div className="rounded border p-3 space-y-1">
<div><strong>ID:</strong> {data.id}</div>
<div><strong>Code:</strong> {data.ticket_code}</div>
<div><strong>Status:</strong> {data.status}</div>
<div><strong>Issued:</strong> {data.issued_at ?? '-'}</div>
<div><strong>Expires:</strong> {data.expires_at ?? '-'}</div>
<div><strong>Patente:</strong> {data.vehicle_plate ?? '-'}</div>
<div><strong>Categoría:</strong> {data.category ?? '-'}</div>
<div><strong>Pago:</strong> {data.payment_method ?? '-'}</div>
<div><strong>Total:</strong> {typeof data.total_charged === 'number' ? data.total_charged : '-'}</div>
<div><strong>Parking:</strong> {data.parking_name ?? '-'}</div>
</div>
)}
</div>
);
}
