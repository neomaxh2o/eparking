// src/app/lib/tarifaActions.ts

import { Tarifa } from '@/interfaces/tarifa';

// Crear una nueva tarifa
export async function createTarifa(tarifa: Tarifa) {
  const res = await fetch('/api/tarifas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tarifa),
  });

  if (!res.ok) {
    throw new Error('Error al crear la tarifa');
  }

  return res.json();
}

// Actualizar una tarifa existente
export async function updateTarifa(tarifaId: string, tarifa: Tarifa) {
  const res = await fetch(`/api/tarifas?id=${tarifaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tarifa),
  });

  if (!res.ok) {
    throw new Error('Error al actualizar la tarifa');
  }

  return res.json();
}

// Eliminar una tarifa
export async function deleteTarifa(tarifaId: string) {
  const res = await fetch(`/api/tarifas?id=${tarifaId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Error al eliminar la tarifa');
  }

  return res.json();
}
