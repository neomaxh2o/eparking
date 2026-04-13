import { apiClient } from '@/shared/api/client';
import type {
  PricingCatalogResponse,
  PricingCategoryDto,
  PricingQuoteDto,
  PricingRateOptionDto,
} from '@/shared/api/contracts/pricing';
import type { ITarifa, TarifaDia, TarifaHora, TarifaLibre, TarifaMensual } from '@/interfaces/Tarifa/tarifa';

type LegacyTarifasResponse = {
  success?: boolean;
  data?: ITarifa[];
};

function toOption(item: TarifaHora | TarifaDia | TarifaMensual | TarifaLibre): PricingRateOptionDto {
  return {
    tipoEstadia: item.tipoEstadia,
    cantidad: 'cantidad' in item && typeof item.cantidad === 'number' ? item.cantidad : 0,
    precioUnitario: Number(item.precioUnitario ?? 0),
    precioTotal: Number(item.precioTotal ?? 0),
    bonificacionPorc: item.bonificacionPorc,
    precioConDescuento: item.precioConDescuento,
  };
}

function mapTarifa(item: ITarifa): PricingCategoryDto {
  const options: PricingRateOptionDto[] = [
    ...(item.tarifasHora ?? []).map(toOption),
    ...(item.tarifasPorDia ?? []).map(toOption),
    ...(item.tarifaMensual ?? []).map(toOption),
    ...(item.tarifaLibre ?? []).map(toOption),
  ];

  return {
    tarifaId: String(item._id),
    parkinglotId: String(item.parkinglotId),
    category: item.category,
    options,
  };
}

export async function fetchPricingCatalog(parkinglotId?: string): Promise<PricingCatalogResponse> {
  const query = parkinglotId ? `?parkinglotId=${encodeURIComponent(parkinglotId)}` : '';
  const response = await apiClient<LegacyTarifasResponse>(`/api/tarifas${query}`);
  const tarifas = Array.isArray(response?.data) ? response.data : [];

  return {
    parkinglotId,
    categories: tarifas.map(mapTarifa),
  };
}

export async function fetchPricingQuote(sessionId: string): Promise<PricingQuoteDto> {
  throw new Error(
    `Pricing quote by session is not supported yet. Use fetchPricingCatalog(parkinglotId) instead. session=${sessionId}`
  );
}
