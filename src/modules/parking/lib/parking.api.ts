import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { ensureTraceId, debug as debugLogger } from '@/lib/debugLogger';
import type {
  CreateParkingInput,
  CreateParkingResponse,
  ParkingDto,
  ParkingListResponse,
} from '@/shared/api/contracts/parking';

type LegacyParkingRecord = {
  _id?: string;
  name?: string;
  owner?: string;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };
  totalSpots?: number;
  availableSpots?: number;
  pricePerHour?: number;
  schedule?: {
    open?: string;
    close?: string;
  };
  isAvailable?: boolean;
};

type LegacyParkingListResponse = {
  parkings?: LegacyParkingRecord[];
};

function mapLegacyParking(input: LegacyParkingRecord): ParkingDto {
  const id = String(input._id ?? '');

  return {
    id,
    _id: id,
    code: undefined,
    name: String(input.name ?? ''),
    owner: input.owner ? String(input.owner) : undefined,
    location: input.location
      ? {
          address: String(input.location.address ?? ''),
          lat: Number(input.location.lat ?? 0),
          lng: Number(input.location.lng ?? 0),
        }
      : undefined,
    totalSpots: Number(input.totalSpots ?? 0),
    availableSpots: Number(input.availableSpots ?? 0),
    pricePerHour: Number(input.pricePerHour ?? 0),
    schedule: input.schedule
      ? {
          open: String(input.schedule.open ?? ''),
          close: String(input.schedule.close ?? ''),
        }
      : undefined,
    isAvailable: Boolean(input.isAvailable ?? true),
  };
}

export async function fetchParkings(): Promise<ParkingListResponse> {
  const response = await apiClient<LegacyParkingListResponse>(API_ENDPOINTS.parkingList);
  return Array.isArray(response?.parkings) ? response.parkings.map(mapLegacyParking) : [];
}

export async function createParking(input: CreateParkingInput): Promise<CreateParkingResponse> {
  const traceId = ensureTraceId(undefined);
  if (process.env.NEXT_PUBLIC_DEBUG_PARKING === 'true') debugLogger('parking.create.client.request', { traceId, payloadSummary: { name: input.name, owner: input.owner } });
  const res = await apiClient<CreateParkingResponse>(API_ENDPOINTS.parkingCreate, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'X-Trace-Id': traceId },
  });
  if (process.env.NEXT_PUBLIC_DEBUG_PARKING === 'true') debugLogger('parking.create.client.result', { traceId, result: res });
  return res;
}

export async function updateParkingAvailability(id: string, isAvailable: boolean) {
  const traceId = ensureTraceId(undefined);
  if (process.env.NEXT_PUBLIC_DEBUG_PARKING === 'true') debugLogger('parking.updateAvailability.client.request', { traceId, payloadSummary: { id, isAvailable } });
  const res = await apiClient<{ message: string; parking?: LegacyParkingRecord }>(
    `${API_ENDPOINTS.parking}/update-availability`,
    {
      method: 'PATCH',
      body: JSON.stringify({ id, isAvailable }),
      headers: { 'X-Trace-Id': traceId },
    }
  );
  if (process.env.NEXT_PUBLIC_DEBUG_PARKING === 'true') debugLogger('parking.updateAvailability.client.result', { traceId, result: res });
  return res;
}
