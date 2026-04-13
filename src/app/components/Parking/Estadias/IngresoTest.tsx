'use client';
import React from 'react';
import { useIngreso, TipoEstadia } from '@/app/hooks/Parking/Caja/useIngreso';
import { Tarifa as TarifaInterface, Categoria } from '@/interfaces/tarifa';

interface IngresoTestProps {
  tarifas: TarifaInterface[];
  setFormIngreso: React.Dispatch<any>;
  onIngresado: (data: any) => void; // 🔹 callback al componente padre para abrir modal rápido
}

const IngresoTest: React.FC<IngresoTestProps> = ({ tarifas, setFormIngreso, onIngresado }) => {
  const { registrarIngreso, loading } = useIngreso();

  const handleGenerarRapido = async () => {
    const patente = "Sin Patente";
    const categoria: Categoria = 'Automóvil';
    const tipoEstadia: TipoEstadia = 'libre';
    const tarifa = tarifas.find(t => t.category === categoria);

    if (!tarifa) {
      console.error('No hay tarifa disponible para Automóvil');
      return;
    }

    const payload = {
      ticketNumber: `RAP-${Date.now()}`,
      patente,
      categoria,
      tipoEstadia,
      tarifaId: tarifa._id!,
      horaEntrada: new Date().toISOString(),
    };

    try {
      const data = await registrarIngreso(payload);
      console.log("✅ Ticket rápido generado:", data);

      // Actualizamos el form del padre para reflejar datos en caso de querer reutilizarlos
      setFormIngreso({
        patente: data.patente,
        categoria: data.categoria,
        tarifaId: data.tarifaId,
        tipoEstadia: data.tipoEstadia,
        horaEntrada: data.horaEntrada,
      });

      // 🔹 Llamamos al callback para abrir el modal rápido
      onIngresado(data);
    } catch (err: any) {
      console.error("❌ Error guardando ticket rápido:", err.message);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerarRapido}
        className="bg-purple-600 text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? "Guardando..." : "Generar Ticket Rápido"}
      </button>
      <p className="text-gray-600 text-sm mt-1">Leyenda: Ticket rápido sin patente</p>
    </div>
  );
};

export default IngresoTest;
