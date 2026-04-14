import React from 'react';

interface AccionesTarifaProps {
  loading?: boolean;
  onGuardar?: () => void;
  onEditar?: () => void;
  onBorrar?: () => void;
  onReservar?: () => void;
}

export default function AccionesTarifa({
  loading,
  onGuardar,
  onEditar,
  onBorrar,
  onReservar,
}: AccionesTarifaProps) {
  const handleGuardar = (e?: React.MouseEvent) => {
    e?.preventDefault();
    onGuardar?.();
  };

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {onGuardar ? (
        <button
          onClick={handleGuardar}
          disabled={loading}
          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      ) : null}

      {onEditar ? (
        <button
          onClick={onEditar}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Editar
        </button>
      ) : null}

      {onBorrar ? (
        <button
          onClick={onBorrar}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Eliminar
        </button>
      ) : null}

      {onReservar ? (
        <button
          onClick={onReservar}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Reservar
        </button>
      ) : null}
    </div>
  );
}
