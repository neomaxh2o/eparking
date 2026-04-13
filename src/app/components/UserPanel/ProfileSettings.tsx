'use client';

type ClientProfile = {
  email?: string;
  name?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  ciudad?: string;
  domicilio?: string;
  patenteVehiculo?: string;
  modeloVehiculo?: string;
  categoriaVehiculo?: string;
  assignedParking?: { _id: string; name: string } | null;
} | null;

type ClientAbonado = {
  estado?: string;
  tarifaNombre?: string;
  billingMode?: string;
} | null;

export default function ProfileSettings({ profile, abonado }: { profile: ClientProfile; abonado: ClientAbonado }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Mi Perfil</h2>
      {!abonado && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          Tu usuario está autenticado correctamente, pero todavía no tiene un abono asociado. Los datos del perfil se muestran igual.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-3 rounded bg-white"><strong>Nombre</strong><div>{profile?.nombre || profile?.name || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Apellido</strong><div>{profile?.apellido || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Email</strong><div>{profile?.email || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>DNI</strong><div>{profile?.dni || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Teléfono</strong><div>{profile?.telefono || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Ciudad</strong><div>{profile?.ciudad || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Domicilio</strong><div>{profile?.domicilio || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Patente</strong><div>{profile?.patenteVehiculo || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Modelo vehículo</strong><div>{profile?.modeloVehiculo || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Categoría vehículo</strong><div>{profile?.categoriaVehiculo || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Parking asignado</strong><div>{profile?.assignedParking?.name || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Plan abonado</strong><div>{abonado?.tarifaNombre || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Modo de facturación</strong><div>{abonado?.billingMode || '-'}</div></div>
        <div className="border p-3 rounded bg-white"><strong>Estado</strong><div>{abonado?.estado || '-'}</div></div>
      </div>
    </div>
  );
}
