import React from "react";
import { TarifaHora } from "@/interfaces/Tarifa/tarifa";

interface TarifaHoraFormProps {
  tarifasPorHora: TarifaHora[];
  setTarifasPorHora: (value: TarifaHora[]) => void;
  habilitarTarifaHora: boolean;
}

export default function TarifaHoraForm({
  tarifasPorHora,
  setTarifasPorHora,
  habilitarTarifaHora,
}: TarifaHoraFormProps) {
  // ✅ Agregar nueva fila vacía
  const handleAddRow = () => {
    setTarifasPorHora([
      ...tarifasPorHora,
      {
        tipoEstadia: "hora",
        cantidad: 1,
        precioUnitario: 0,
        bonificacionPorc: 0,
        precioConDescuento: 0,
        precioTotal: 0,
      },
    ]);
  };

  // ✅ Editar campo específico y recalcular totales
  const handleChange = (
    index: number,
    field: keyof TarifaHora,
    value: number
  ) => {
    const updated = [...tarifasPorHora];
    updated[index] = { ...updated[index], [field]: value };

    // recalcular precio con descuento
    const bonificacionValida =
      updated[index].bonificacionPorc !== undefined &&
      updated[index].bonificacionPorc! >= 0 &&
      updated[index].bonificacionPorc! <= 100;

    updated[index].precioConDescuento = bonificacionValida
      ? updated[index].precioUnitario * (1 - (updated[index].bonificacionPorc ?? 0) / 100)
      : updated[index].precioUnitario;

    updated[index].precioTotal = updated[index].cantidad * (updated[index].precioConDescuento ?? updated[index].precioUnitario);

    setTarifasPorHora(updated);
  };

  // ✅ Eliminar fila
  const handleRemoveRow = (index: number) => {
    const updated = tarifasPorHora.filter((_, i) => i !== index);
    setTarifasPorHora(updated);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-blue-800">
        Tarifas por Hora
      </h3>
      <table className="w-full table-auto border">
        <thead>
          <tr className="bg-blue-100">
            <th className="border px-4 py-2">Cantidad de Horas</th>
            <th className="border px-4 py-2">Precio Unitario ($)</th>
            <th className="border px-4 py-2">Bonificación %</th>
            <th className="border px-4 py-2">Precio con Descuento</th>
            <th className="border px-4 py-2">Total a Pagar</th>
            <th className="border px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tarifasPorHora.map((t, index) => (
            <tr
              key={index}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
            >
              <td className="border px-2 py-1 text-center">
                <input
                  type="number"
                  value={t.cantidad}
                  onChange={(e) =>
                    handleChange(index, "cantidad", parseInt(e.target.value))
                  }
                  className="w-20 px-2 py-1 border text-center"
                  min={1}
                  disabled={!habilitarTarifaHora}
                />
              </td>
              <td className="border px-2 py-1 text-center">
                <input
                  type="number"
                  value={t.precioUnitario}
                  onChange={(e) =>
                    handleChange(index, "precioUnitario", parseFloat(e.target.value))
                  }
                  className="w-24 px-2 py-1 border text-center"
                  min={0}
                  disabled={!habilitarTarifaHora}
                />
              </td>
              <td className="border px-2 py-1 text-center">
                <input
                  type="number"
                  value={t.bonificacionPorc ?? 0}
                  onChange={(e) =>
                    handleChange(index, "bonificacionPorc", parseFloat(e.target.value))
                  }
                  className="w-20 px-2 py-1 border text-center"
                  min={0}
                  max={100}
                  disabled={!habilitarTarifaHora}
                />
              </td>
              <td className="border px-2 py-1 text-right font-semibold">
                ${t.precioConDescuento?.toFixed(2) ?? "0.00"}
              </td>
              <td className="border px-2 py-1 text-right font-semibold">
                ${t.precioTotal.toFixed(2)}
              </td>
              <td className="border px-2 py-1 text-center">
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="text-red-600 hover:underline"
                  disabled={!habilitarTarifaHora}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {habilitarTarifaHora && (
        <div className="mt-3">
          <button
            onClick={handleAddRow}
            className="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            + Agregar Tarifa por Hora
          </button>
        </div>
      )}
    </div>
  );
}
