'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, Wallet, CreditCard, User } from 'lucide-react';
import AccountStatus from './AccountStatus';
import InvoicePayment from './InvoicePayment';
import ProfileSettings from './ProfileSettings';

type TabId = 'accountStatus' | 'invoices' | 'profile';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'accountStatus', label: 'Estado de Cuenta', icon: <Wallet size={18} /> },
  { id: 'invoices', label: 'Facturas', icon: <CreditCard size={18} /> },
  { id: 'profile', label: 'Mi Perfil', icon: <User size={18} /> },
];

type ClientProfile = {
  id: string;
  email: string;
  role: string;
  name: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  ciudad: string;
  domicilio: string;
  patenteVehiculo: string;
  modeloVehiculo: string;
  categoriaVehiculo: string;
  assignedParking?: { _id: string; name: string } | null;
};

type ClientAbonado = {
  id: string;
  estado: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  ciudad: string;
  domicilio: string;
  email: string;
  vehiculos: Array<{ patente: string; modelo?: string; categoria?: string; activo: boolean }>;
  accesos: Array<{ tipo: string; valor: string; descripcion?: string; activo: boolean }>;
  observaciones: string;
  fechaAlta?: string | null;
  fechaVencimiento?: string | null;
  billingMode: string;
  tarifaId: string;
  tarifaNombre: string;
  importeBase: number;
  assignedParking?: { _id: string; name: string } | null;
  financialStatus: 'al_dia' | 'con_deuda' | 'moroso';
  hasDebt: boolean;
  hasOverdueDebt: boolean;
};

type ClientInvoice = {
  id: string;
  abonadoId: string;
  invoiceCode: string;
  estado: string;
  monto: number;
  moneda: string;
  tipoFacturacion: string;
  periodoLabel: string;
  fechaEmision?: string | null;
  fechaVencimiento?: string | null;
  fechaPago?: string | null;
  tarifaNombre: string;
  abonadoNombre: string;
  paymentProvider: string;
  paymentReference: string;
  paymentMethod: string;
  externalStatus: string;
};

export default function UserPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('accountStatus');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [abonado, setAbonado] = useState<ClientAbonado | null>(null);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [profileRes, abonadoRes, facturasRes] = await Promise.all([
          fetch('/api/v2/client/me', { cache: 'no-store' }),
          fetch('/api/v2/client/abonado', { cache: 'no-store' }),
          fetch('/api/v2/client/facturas', { cache: 'no-store' }),
        ]);

        const [profileJson, abonadoJson, facturasJson] = await Promise.all([
          profileRes.json(),
          abonadoRes.json(),
          facturasRes.json(),
        ]);

        if (!profileRes.ok) throw new Error(profileJson?.error || 'Error cargando perfil');
        if (!abonadoRes.ok) throw new Error(abonadoJson?.error || 'Error cargando abonado');
        if (!facturasRes.ok) throw new Error(facturasJson?.error || 'Error cargando facturas');

        if (!mounted) return;
        setProfile(profileJson);
        setAbonado(abonadoJson);
        setInvoices(Array.isArray(facturasJson) ? facturasJson : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || 'Error cargando panel de usuario');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-section max-w-5xl mx-auto p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Usuario</h1>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'border-gray-300 bg-gray-200 text-gray-800'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">Cargando panel...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : (
        <div className="min-h-[350px] space-y-4">
          {!abonado && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              No encontramos un abono asociado a este usuario. El perfil está disponible, pero el estado de cuenta puede mostrarse incompleto.
            </div>
          )}
          {activeTab === 'accountStatus' && <AccountStatus profile={profile} abonado={abonado} invoices={invoices} />}
          {activeTab === 'invoices' && <InvoicePayment invoices={invoices} />}
          {activeTab === 'profile' && <ProfileSettings profile={profile} abonado={abonado} />}
        </div>
      )}
    </div>
  );
}
