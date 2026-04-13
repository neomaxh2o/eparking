'use client';

import { usePlazas } from '@/modules/plazas/hooks/usePlazas';

export default function PlazasPageModule() {
const { plazas, loading, error } = usePlazas();

if (loading) return <div className="p-4">Cargando plazas...</div>;
if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

return (
<div className="p-4 space-y-3">
<h1 className="text-xl font-semibold">Plazas vNext</h1>
<ul className="space-y-2">
{plazas.map((plaza) => (
<li key={plaza._id} className="rounded border p-3">
<div className="font-medium">{plaza.nombre}</div>
<div className="text-sm text-gray-500">Estado: {plaza.estado}</div>
</li>
))}
</ul>
</div>
);
}
