import React from 'react';
import CategorySelector, { Categoria } from '@/app/components/Parking/Tarifas/CategorySelector';

interface TipoTarifaSelectorProps {
  categoria: Categoria;
  setCategoria: React.Dispatch<React.SetStateAction<Categoria>>;
  habilitarTarifaHora: boolean;
  setHabilitarTarifaHora: React.Dispatch<React.SetStateAction<boolean>>;
  habilitarTarifaPorDia: boolean;
  setHabilitarTarifaPorDia: React.Dispatch<React.SetStateAction<boolean>>;
  habilitarTarifaMes: boolean;
  setHabilitarTarifaMes: React.Dispatch<React.SetStateAction<boolean>>;
  habilitarTarifaLibre: boolean;
  setHabilitarTarifaLibre: React.Dispatch<React.SetStateAction<boolean>>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-gray-900" />
      {label}
    </label>
  );
}

export default function TipoTarifaSelector({
  categoria,
  setCategoria,
  habilitarTarifaHora,
  setHabilitarTarifaHora,
  habilitarTarifaPorDia,
  setHabilitarTarifaPorDia,
  habilitarTarifaMes,
  setHabilitarTarifaMes,
  habilitarTarifaLibre,
  setHabilitarTarifaLibre,
}: TipoTarifaSelectorProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
      <div className="max-w-sm">
        <CategorySelector value={categoria} onChange={setCategoria} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Toggle checked={habilitarTarifaHora} onChange={() => setHabilitarTarifaHora(v => !v)} label="Tarifa por hora" />
        <Toggle checked={habilitarTarifaPorDia} onChange={() => setHabilitarTarifaPorDia(v => !v)} label="Tarifas por día" />
        <Toggle checked={habilitarTarifaMes} onChange={() => setHabilitarTarifaMes(v => !v)} label="Tarifas mensuales" />
        <Toggle checked={habilitarTarifaLibre} onChange={() => setHabilitarTarifaLibre(v => !v)} label="Tarifa libre" />
      </div>
    </div>
  );
}
