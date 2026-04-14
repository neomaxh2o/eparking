'use client';
import React, { useState, useEffect } from 'react';
import { useNovedades, Novedad } from '@/app/hooks/Parking/useNovedades';
import ListaNovedades from './ListaNovedades';
import CrearNovedad from './CrearNovedad';
import TabsCategorias from './TabsCategorias';
import Buscador from './Buscador';
import { Operador } from '@/interfaces/Operador';
import { Parking } from '@/interfaces/parking';
import { useUsers } from '@/app/hooks/Users/useUsers';
import { useParkingLots } from '@/app/hooks/Parking/useParkingLots';

const categorias = ['Todos', 'Turnos', 'Estadías', 'Administración', 'Caja', 'Otros', 'Mensajes'];
const ITEMS_PER_PAGE = 10;

interface NovedadesPanelProps {
  currentUserId: string;
  currentUserName: string; // ✅ nombre del usuario para author
  assignedParkingId?: string;
  role: 'client' | 'owner' | 'operator';
}

export default function NovedadesPanel({ currentUserId, currentUserName, assignedParkingId, role }: NovedadesPanelProps) {
  const { users } = useUsers();
  const { parkings } = useParkingLots();

  const ownerParkings: Parking[] = role === 'owner' ? (parkings ?? []).filter(p => p.owner === currentUserId) : [];
  const operadores: Operador[] = (users ?? [])
    .filter(u => u.role === 'operator')
    .map(u => ({
      _id: u._id,
      name: u.name,
      assignedParkingId: u.assignedParking?._id ?? null,
    }));

  const { novedades = [], loading, error, crearNovedad, fetchNovedades } = useNovedades(currentUserName);

  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(categorias[1]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [esGlobal, setEsGlobal] = useState(false);
  const [parkingSeleccionado, setParkingSeleccionado] = useState<string | null>(assignedParkingId ?? null);

  useEffect(() => {
    fetchNovedades(assignedParkingId);
  }, [assignedParkingId, fetchNovedades]);

  // Filtrado por categoría y búsqueda
  const novedadesFiltradas = (novedades ?? [])
    .filter(n => activeTab === 'Todos' ? n.category !== 'Mensajes' : n.category === activeTab)
    .filter(n => n.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(novedadesFiltradas.length / ITEMS_PER_PAGE);
  const novedadesPagina = novedadesFiltradas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <p className="text-center text-gray-600">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-xl font-['Roboto'] space-y-8">
      <CrearNovedad
        categoria={categoria}
        setCategoria={setCategoria}
        descripcion={descripcion}
        setDescripcion={setDescripcion}
        operadores={operadores ?? []}
        esGlobal={esGlobal}
        setEsGlobal={setEsGlobal}
        parkingSeleccionado={parkingSeleccionado}
        setParkingSeleccionado={setParkingSeleccionado}
        parkingsSafe={role === 'owner' ? ownerParkings ?? [] : parkings ?? []}
        destinatarios={destinatarios}
        setDestinatarios={setDestinatarios}
        assignedParkingId={assignedParkingId}
        crearNovedad={crearNovedad}
        role={role}
        userName={currentUserName}
      />

      <TabsCategorias
        categorias={categorias}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCurrentPage={setCurrentPage}
      />

      <Buscador
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setCurrentPage={setCurrentPage}
      />

      <ListaNovedades
        novedades={novedadesPagina}
        currentUserName={currentUserName}
      />

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
