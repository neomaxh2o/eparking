'use client';

import { useParkingsVNext } from '@/modules/parking/hooks/useParkingsVNext';

export default function ParkingListVNext() {
const { data, loading, error } = useParkingsVNext();

if (loading) return <div className="p-4">Cargando parkings...</div>;
if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

return (
<div className="p-4 space-y-3">
<h1 className="text-xl font-semibold">Parking List vNext</h1>
<ul className="space-y-2">
{data.map((parking) => (
<li key={parking.id} className="rounded border p-3">
<div className="font-medium">{parking.name}</div>
<div className="text-sm text-gray-500">ID: {parking.id}</div>
<div className="text-sm text-gray-500">{parking.location?.address ?? 'sin dirección'}</div>
</li>
))}
</ul>
</div>
);
}
