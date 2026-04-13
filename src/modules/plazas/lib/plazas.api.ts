import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import type { PlazaListResponse } from '@/shared/api/contracts/plazas';

type LegacyPlazaRecord = {
  _id?: string;
  nombre?: string;
  estado?: string;
  parkinglotId?: string | null;
};

function normalizeEstado(value: unknown): PlazaListResponse[number]['estado'] {
  return value === 'ocupada' || value === 'reservada' || value === 'bloqueada'
    ? value
    : 'disponible';
}

export async function fetchPlazas(): Promise<PlazaListResponse> {
  const response = await apiClient<LegacyPlazaRecord[]>(API_ENDPOINTS.plazas);
  return Array.isArray(response)
    ? response.map((item) => ({
        _id: String(item._id ?? ''),
        nombre: String(item.nombre ?? ''),
        estado: normalizeEstado(item.estado),
        parkinglotId: item.parkinglotId ?? null,
      }))
    : [];
}
