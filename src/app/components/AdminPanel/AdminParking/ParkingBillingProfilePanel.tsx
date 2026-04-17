'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParkings as useParkingsModule } from '@/modules/parking/hooks/useParkings';
import { useOwnerOperations } from '@/app/components/AdminPanel/OwnerOperationsContext';

const TAX_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'Responsable inscripto' },
  { value: 'monotributo', label: 'Monotributo' },
  { value: 'exento', label: 'Exento' },
  { value: 'consumidor_final', label: 'Consumidor final' },
  { value: 'no_categorizado', label: 'No categorizado' },
] as const;

const DOCUMENT_TYPES = [
  { value: 'cuit', label: 'CUIT' },
  { value: 'dni', label: 'DNI' },
  { value: 'otro', label: 'Otro' },
] as const;

const VOUCHER_TYPES = [
  { value: 'consumidor_final', label: 'Consumidor final' },
  { value: 'factura_a', label: 'Factura A' },
  { value: 'factura_b', label: 'Factura B' },
  { value: 'factura_c', label: 'Factura C' },
] as const;

const EMPTY_PROFILE = {
  enabled: false,
  businessName: '',
  taxCondition: 'consumidor_final',
  documentType: 'cuit',
  documentNumber: '',
  pointOfSale: '',
  voucherTypeDefault: 'consumidor_final',
  iibb: '',
  address: '',
  city: '',
  email: '',
  phone: '',
};

export default function ParkingBillingProfilePanel({
  ownerId,
}: {
  ownerId?: string;
}) {
  const { parkings, loading } = useParkingsModule();
  const ownerOperations = useOwnerOperations();
  const inlineStatusEnabled = !ownerOperations;
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerOperations) return;
    if (message) ownerOperations.setStatusMessage?.({ type: 'success', text: message });
    if (error) ownerOperations.setStatusMessage?.({ type: 'error', text: error });
  }, [message, error, ownerOperations]);

  const availableParkings = useMemo(() => {
    if (!ownerId) return parkings;
    return parkings.filter((parking) => String(parking.owner ?? '') === String(ownerId));
  }, [parkings, ownerId]);

  useEffect(() => {
    if (ownerOperations?.selectedParkingId) {
      setSelectedParkingId(String(ownerOperations.selectedParkingId));
      return;
    }
    if (!selectedParkingId && availableParkings.length > 0) {
      setSelectedParkingId(String(availableParkings[0]._id ?? availableParkings[0].id ?? ''));
    }
  }, [availableParkings, selectedParkingId, ownerOperations?.selectedParkingId]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!selectedParkingId) return;
      try {
        setLoadingProfile(true);
        setError(null);
        setMessage(null);
        const res = await fetch(`/api/v2/billing/parkings/${selectedParkingId}/profile`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el perfil fiscal');
        setForm({ ...EMPTY_PROFILE, ...(data.billingProfile ?? {}) });
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [selectedParkingId]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!selectedParkingId) {
      setError('Debes seleccionar una playa.');
      return;
    }

    if (form.enabled) {
      const digitsOnly = String(form.documentNumber || '').replace(/\D/g, '');
      if (!String(form.businessName || '').trim()) {
        setError('La razón social es obligatoria cuando el perfil fiscal está habilitado.');
        return;
      }
      if (!String(form.documentNumber || '').trim()) {
        setError('El número fiscal es obligatorio cuando el perfil fiscal está habilitado.');
        return;
      }
      if (!String(form.pointOfSale || '').trim()) {
        setError('El punto de venta es obligatorio cuando el perfil fiscal está habilitado.');
        return;
      }
      if (form.documentType === 'cuit' && digitsOnly.length !== 11) {
        setError('El CUIT debe tener 11 dígitos.');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch(`/api/v2/billing/parkings/${selectedParkingId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el perfil fiscal');
      setForm({ ...EMPTY_PROFILE, ...(data.billingProfile ?? {}) });
      setMessage('Configuración fiscal guardada correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Configuración fiscal por playa</h3>
        <p className="mt-1 text-sm text-gray-500">
          Define los datos de empresa que usará la facturación para la playa seleccionada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select
          value={selectedParkingId}
          onChange={(e) => setSelectedParkingId(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3"
          disabled={loading || loadingProfile}
        >
          <option value="">Seleccionar playa</option>
          {availableParkings.map((parking) => (
            <option key={parking._id} value={parking._id}>
              {parking.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(form.enabled)}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          Habilitar perfil fiscal para esta playa
        </label>
      </div>

      {inlineStatusEnabled && message ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div> : null}
      {inlineStatusEnabled && error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {form.enabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Campos obligatorios con perfil habilitado: razón social, número fiscal y punto de venta. Si el tipo es CUIT, debe tener 11 dígitos.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input value={form.businessName} onChange={(e) => updateField('businessName', e.target.value)} placeholder="Razón social *" className="rounded-xl border border-gray-300 px-4 py-3" />
        <input value={form.pointOfSale} onChange={(e) => updateField('pointOfSale', e.target.value)} placeholder="Punto de venta *" className="rounded-xl border border-gray-300 px-4 py-3" />

        <select value={form.taxCondition} onChange={(e) => updateField('taxCondition', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          {TAX_CONDITIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={form.documentType} onChange={(e) => updateField('documentType', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          {DOCUMENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <input value={form.documentNumber} onChange={(e) => updateField('documentNumber', e.target.value)} placeholder="Número fiscal *" className="rounded-xl border border-gray-300 px-4 py-3" />
        <select value={form.voucherTypeDefault} onChange={(e) => updateField('voucherTypeDefault', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
          {VOUCHER_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <input value={form.iibb} onChange={(e) => updateField('iibb', e.target.value)} placeholder="Ingresos Brutos" className="rounded-xl border border-gray-300 px-4 py-3" />
        <input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email fiscal" className="rounded-xl border border-gray-300 px-4 py-3" />

        <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Teléfono fiscal" className="rounded-xl border border-gray-300 px-4 py-3" />
        <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Ciudad" className="rounded-xl border border-gray-300 px-4 py-3" />
      </div>

      <textarea value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Domicilio fiscal" className="min-h-[110px] w-full rounded-xl border border-gray-300 px-4 py-3" />

      <div className="flex justify-end">
        <button onClick={() => void saveProfile()} disabled={saving || loadingProfile || !selectedParkingId} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-60">
          {saving ? 'Guardando...' : 'Guardar configuración fiscal'}
        </button>
      </div>
    </div>
  );
}
