export type TipoEstadia = 'hora' | 'dia' | 'libre';

export type Categoria = 'Automóvil' | 'Motocicleta' | 'Camioneta' | 'Otros';

export interface CheckinData {
  ticketNumber: string;
  patente: string;
  categoria: Categoria;
  tipoEstadia: TipoEstadia;

  tarifaId: string;
  operadorId: string;
  playaId: string;
}
