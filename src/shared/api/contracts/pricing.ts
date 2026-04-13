export type PricingRateOptionDto = {
  tipoEstadia: 'hora' | 'dia' | 'mensual' | 'libre';
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  bonificacionPorc?: number;
  precioConDescuento?: number;
};

export type PricingQuoteDto = {
  quote_id: string;
  session_id: string;
  amount: number;
  currency: string;
  valid_until?: string | null;
  breakdown?: Record<string, unknown>;
  parking_name?: string | null;
  rate_label?: string | null;
};

export type PricingCategoryDto = {
  tarifaId: string;
  parkinglotId: string;
  category: string;
  options: PricingRateOptionDto[];
};

export type PricingCatalogResponse = {
  parkinglotId?: string;
  categories: PricingCategoryDto[];
};
