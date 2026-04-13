'use client';

import React from 'react';

interface TarifaDiaForm {
  day: number;
  price: number | '';
  discountPercent: number | '';
}

interface TarifasPorDiaFormProps {
  tarifasPorDia: TarifaDiaForm[];
  setTarifasPorDia: React.Dispatch<React.SetStateAction<TarifaDiaForm[]>>;
  applyDiscountToAll: boolean;
  setApplyDiscountToAll: React.Dispatch<React.SetStateAction<boolean>>;
  habilitarTarifaPorDia: boolean;
}

export default function TarifasPorDiaForm({
  tarifasPorDia,
  setTarifasPorDia,
  applyDiscountToAll,
  setApplyDiscountToAll,
  habilitarTarifaPorDia,
}: TarifasPorDiaFormProps) {
  const handleChange = (
    index: number,
    field: keyof Omit<TarifaDiaForm, 'day'>,
    value: string
  ) => {
    const newTarifas = [...tarifasPorDia];
    const valNum = value === '' ? '' : Number(value);

    if (field === 'price' || field === 'discountPercent') {
      if (applyDiscountToAll && field === 'discountPercent') {
        for (let i = 0; i < newTarifas.length; i++) {
          newTarifas[i][field] = valNum;
        }
      } else {
        newTarifas[index][field] = valNum;
      }
    }
    setTarifasPorDia(newTarifas);
  };

  const agregarDia = () => {
    setTarifasPorDia((prev) => [
      ...prev,
      {
        day: prev.length + 1,
        price: '',
        discountPercent: '',
      },
    ]);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-blue-800">Tarifas por Día</h3>
      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-blue-100">
            <th className="border px-4 py-2">Día</th>
            <th className="border px-4 py-2">Precio</th>
            <th className="border px-4 py-2">Bonificación %</th>
            <th className="border px-4 py-2">Precio con Descuento</th>
            <th className="border px-4 py-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {tarifasPorDia.map((t, i) => {
            const descuento = typeof t.discountPercent === 'number' ? t.discountPercent : 0;
            const precioDescuento =
              typeof t.price === 'number' ? t.price * (1 - descuento / 100) : 0;

            return (
              <tr key={t.day} className="odd:bg-white even:bg-gray-50">
                <td className="border px-4 py-2 text-center">
                  <input
                    type="number"
                    min={1}
                    value={t.day}
                    onChange={(e) => {
                      const valNum = e.target.value === '' ? '' : Number(e.target.value);
                      const newTarifas = [...tarifasPorDia];
                      newTarifas[i].day = valNum === '' ? 0 : valNum;
                      setTarifasPorDia(newTarifas);
                    }}
                    disabled={!habilitarTarifaPorDia}
                    className="w-full px-2 py-1 border text-center"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    value={t.price}
                    onChange={(e) => handleChange(i, 'price', e.target.value)}
                    disabled={!habilitarTarifaPorDia}
                    className="w-full px-2 py-1 border"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={t.discountPercent}
                    onChange={(e) => handleChange(i, 'discountPercent', e.target.value)}
                    disabled={!habilitarTarifaPorDia}
                    className="w-full px-2 py-1 border"
                  />
                </td>
                <td className="border px-4 py-2 text-right font-semibold">
                  {`$ ${precioDescuento.toFixed(2)}`}
                </td>
                <td className="border px-4 py-2 text-center">
                  {habilitarTarifaPorDia && (
                    <button
                      onClick={() => {
                        if (tarifasPorDia.length > 1) {
                          setTarifasPorDia((prev) =>
                            prev
                              .filter((_, idx) => idx !== i)
                              .map((t, idx) => ({ ...t, day: idx + 1 }))
                          );
                        }
                      }}
                      className="text-red-600 font-bold"
                    >
                      &times;
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={applyDiscountToAll}
            onChange={() => setApplyDiscountToAll((v) => !v)}
            disabled={!habilitarTarifaPorDia}
          />
          Aplicar bonificación a todas las filas
        </label>

        {habilitarTarifaPorDia && (
          <button
            onClick={agregarDia}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Agregar día
          </button>
        )}
      </div>
    </div>
  );
}
