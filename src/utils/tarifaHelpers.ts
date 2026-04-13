import { ITarifa, Categoria } from '@/interfaces/Tarifa/tarifa';
import { SubTarifa } from '@/app/components/Parking/Estadias/Formularios/FormPadre'; // asegúrate que apunta al archivo correcto

// Mapea subtarifa seleccionada + tarifa completa
export function mapTarifasToSubtarifas(
  tarifa: ITarifa,
  subtarifa: SubTarifa
): SubTarifa & { categoria: Categoria; tarifaId: string } {
  return {
    ...subtarifa,
    categoria: tarifa.category,
    tarifaId: subtarifa._id ?? '', // siempre aseguramos string
  };
}
