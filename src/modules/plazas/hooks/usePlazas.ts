import { useEffect, useState } from 'react';
import type { PlazaListResponse } from '@/shared/api/contracts/plazas';
import { fetchPlazas } from '@/modules/plazas/lib';

export function usePlazas() {
const [plazas, setPlazas] = useState<PlazaListResponse>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
let mounted = true;
fetchPlazas()
.then((res) => {
if (mounted) setPlazas(res);
})
.catch((err) => {
if (mounted) setError(err instanceof Error ? err.message : 'Unknown error');
})
.finally(() => {
if (mounted) setLoading(false);
});

return () => {
mounted = false;
};
}, []);

return { plazas, loading, error };
}
