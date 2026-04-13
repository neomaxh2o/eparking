// hooks/useNovedadesFiltradas.ts
import { useMemo } from 'react';
import { Novedad } from '@/interfaces/Novedad';

export function useNovedadesFiltradas(
  novedades: Novedad[],
  activeTab: string,
  searchTerm: string,
  currentUserId: string,
  assignedParkingId?: string // operador
): Novedad[] {
  return useMemo(() => {
    return novedades
      .filter((novedad) => {
        // Normalizar parkingId como string
        let novParkingId: string | undefined;
        if (!novedad.parkingId) novParkingId = undefined;
        else if (typeof novedad.parkingId === 'string') novParkingId = novedad.parkingId;
        else novParkingId = novedad.parkingId._id;

        // --- Mensajes ---
        if (novedad.category === 'Mensajes') {
          // Mensaje global, todos lo ven
          if (novedad.isGlobal) return true;

          // Mensaje dirigido a destinatarios específicos
          const esDestinatario = novedad.recipients?.includes(currentUserId);
          const coincideParking = assignedParkingId && novParkingId === assignedParkingId;

          return Boolean(esDestinatario || coincideParking);
        }

        // --- Filtrado general ---
        const matchCategoria = activeTab === 'Todos' || novedad.category === activeTab;

        const matchBusqueda =
          novedad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (novedad.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

        const matchParking = !assignedParkingId || novParkingId === assignedParkingId;

        return matchCategoria && matchBusqueda && matchParking;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [novedades, activeTab, searchTerm, currentUserId, assignedParkingId]);
}
