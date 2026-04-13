'use client';

import { useCreateParking } from '@/modules/parking/hooks/useCreateParking';

export default function ParkingCreatePageModule() {
const { form, loading, error, success, updateField, submit } = useCreateParking();

return (
<div className="p-4 space-y-4">
<h1 className="text-xl font-semibold">Crear parking</h1>

<div className="grid gap-3 md:grid-cols-2">
<input
className="border rounded px-3 py-2"
placeholder="Nombre"
value={form.name}
onChange={(e) => updateField('name', e.target.value)}
/>
<input
className="border rounded px-3 py-2"
placeholder="Código interno"
value={form.code}
onChange={(e) => updateField('code', e.target.value)}
/>
<input
className="border rounded px-3 py-2"
placeholder="Owner"
value={form.owner}
onChange={(e) => updateField('owner', e.target.value)}
/>
<input
className="border rounded px-3 py-2"
placeholder="Dirección"
value={form.location.address}
onChange={(e) =>
updateField('location', {
...form.location,
address: e.target.value,
} as never)
}
/>
</div>

<button
className="rounded bg-black text-white px-4 py-2"
onClick={submit}
disabled={loading || !form.name.trim()}
>
{loading ? 'Guardando...' : 'Crear parking'}
</button>

{success && <div className="text-green-600">Parking creado correctamente.</div>}
{error && <div className="text-red-600">Error: {error}</div>}
</div>
);
}
