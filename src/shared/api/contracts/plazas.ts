export type PlazaStatus = 'disponible' | 'ocupada' | 'reservada' | 'bloqueada';

export type PlazaDto = {
_id: string;
nombre: string;
estado: PlazaStatus;
parkinglotId?: string | null;
};

export type PlazaListResponse = PlazaDto[];
