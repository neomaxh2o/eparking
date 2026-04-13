import { useState } from 'react';
import { createParking as createParkingApi } from '@/modules/parking/lib';
import type { CreateParkingInput, CreateParkingResponse } from '@/shared/api/contracts/parking';

type ParkingCreateForm = CreateParkingInput & {
  code: string;
};

const INITIAL_FORM: ParkingCreateForm = {
  name: '',
  code: '',
  owner: '',
  location: {
    address: '',
    lat: 0,
    lng: 0,
  },
  totalSpots: 0,
  availableSpots: 0,
  pricePerHour: 0,
  schedule: {
    open: '08:00',
    close: '20:00',
  },
};

export function useCreateParking() {
  const [form, setForm] = useState<ParkingCreateForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<CreateParkingResponse | null>(null);

  // updateField supports nested keys using dot notation (e.g., 'location.address' or 'schedule.open')
  function updateField(field: string, value: any) {
    setResponse(null);
    if (field.includes('.')) {
      const parts = field.split('.');
      setForm((prev) => {
        const copy: any = { ...prev };
        let cur: any = copy;
        for (let i = 0; i < parts.length - 1; i++) {
          const p = parts[i];
          cur[p] = { ...(cur[p] || {}) };
          cur = cur[p];
        }
        cur[parts[parts.length - 1]] = value;
        return copy;
      });
    } else {
      setForm((prev) => ({ ...prev, [field]: value } as any));
    }
  }

  async function submit() {
    setLoading(true);
    setError(null);
    setResponse(null);

    const traceId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    try {
      console.log(`parking.create: submitting [traceId=${traceId}]`);
      const res = await createParkingApi({
        name: form.name,
        owner: form.owner || 'pending-owner',
        location: form.location,
        totalSpots: form.totalSpots,
        availableSpots: form.availableSpots,
        pricePerHour: form.pricePerHour,
        schedule: form.schedule,
      });
      setResponse(res);
      setForm((prev) => ({ ...INITIAL_FORM, owner: prev.owner }));
      console.log(`parking.create: success [traceId=${traceId}]`);
      return res;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.log(`parking.create: error [traceId=${traceId}]`);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { form, loading, error, response, updateField, submit };
}
