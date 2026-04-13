import { useEffect, useState } from 'react';
import type { ParkingListResponse } from '@/shared/api/contracts/parking';
import { fetchParkings } from '@/modules/parking/lib';

export function useParkings() {
const [parkings, setParkings] = useState<ParkingListResponse>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
let mounted = true;
fetchParkings()
.then((res) => {
if (mounted) setParkings(res);
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

return { parkings, loading, error };
}
