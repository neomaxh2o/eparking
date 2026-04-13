/**
 * @deprecated Use `@/modules/parking/hooks/useCreateParking` directly.
 * Compatibility layer kept temporarily during consumer migration.
 */
import { useState } from 'react';
import { createParking as createParkingRequest } from '@/modules/parking/lib';
import type { CreateParkingInput, CreateParkingResponse } from '@/shared/api/contracts/parking';

export function useCreateParking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CreateParkingResponse | null>(null);

  async function createParking(form: CreateParkingInput) {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await createParkingRequest(form);
      setResponse(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { createParking, loading, error, response };
}
