// interfaces para AdminPanel

export type TabKey =
  | 'flujo-operativo'
  | 'facturacion'
  | 'control'
  | 'infraestructura'
  | 'users'
  | 'parkings'
  | 'reservations'
  | 'tarifas'
  | 'historico-cajas'
  | 'abonados';

export interface TabConfig {
  key: TabKey;
  label: string;
  content: React.ReactNode;
}
