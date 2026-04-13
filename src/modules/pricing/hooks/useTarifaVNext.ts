import { useEffect, useState } from 'react';
import type { PricingCatalogResponse } from '@/shared/api/contracts/pricing';
import { fetchPricingCatalog } from '@/modules/pricing/lib';

export function useTarifaVNext(parkinglotId?: string) {
  const [data, setData] = useState<PricingCatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchPricingCatalog(parkinglotId)
      .then((res) => {
        if (mounted) setData(res);
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
  }, [parkinglotId]);

  return { data, loading, error };
}
