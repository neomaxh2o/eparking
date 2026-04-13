// interfaces para AdminPanel

export type TabKey = 'users' | 'parkings' | 'reservations' | 'tarifas' | 'historico-cajas' | 'abonados' | 'facturacion';

export interface TabConfig {
  key: TabKey;
  label: string;
  content: React.ReactNode;
}
