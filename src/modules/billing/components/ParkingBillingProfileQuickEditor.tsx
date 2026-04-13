'use client';

import { useEffect, useState } from 'react';

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

export default function ParkingBillingProfileQuickEditor({
  parkinglotId,
  parkingName,
  open,
  onClose,
  onSaved,
}: {
  parkinglotId: string;
  parkingName?: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (billingProfile: any) => void;
}) {
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !parkinglotId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);
        const res = await fetch(`/api/v2/billing/parkings/${parkinglotId}/profile`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el perfil fiscal');
        setForm({ ...EMPTY_PROFILE, ...(data.billingProfile ?? {}) });
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, parkinglotId]);

  if (!open) return null;

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch(`/api/v2/billing/parkings/${parkinglotId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el perfil fiscal');
      setForm({ ...EMPTY_PROFILE, ...(data.billingProfile ?? {}) });
      setMessage('Perfil fiscal actualizado.');
      onSaved?.(data.billingProfile ?? null);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Configurar perfil fiscal</h3>
            <p className="text-sm text-gray-500">{parkingName || 'Playa seleccionada'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cerrar</button>
        </div>

        {loading ? <p className="text-sm text-gray-500">Cargando perfil...</p> : null}
        {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div> : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 md:col-span-2">
            <input type="checkbox" checked={Boolean(form.enabled)} onChange={(e) => updateField('enabled', e.target.checked)} />
            Habilitar perfil fiscal para esta playa
          </label>

          <input value={form.businessName} onChange={(e) => updateField('businessName', e.target.value)} placeholder="Razón social *" className="rounded-xl border border-gray-300 px-4 py-3" />
          <input value={form.pointOfSale} onChange={(e) => updateField('pointOfSale', e.target.value)} placeholder="Punto de venta *" className="rounded-xl border border-gray-300 px-4 py-3" />

          <select value={form.taxCondition} onChange={(e) => updateField('taxCondition', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
            <option value="responsable_inscripto">Responsable inscripto</option>
            <option value="monotributo">Monotributo</option>
            <option value="exento">Exento</option>
            <option value="consumidor_final">Consumidor final</option>
            <option value="no_categorizado">No categorizado</option>
          </select>
          <select value={form.documentType} onChange={(e) => updateField('documentType', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
            <option value="cuit">CUIT</option>
            <option value="dni">DNI</option>
            <option value="otro">Otro</option>
          </select>

          <input value={form.documentNumber} onChange={(e) => updateField('documentNumber', e.target.value)} placeholder="Número fiscal *" className="rounded-xl border border-gray-300 px-4 py-3" />
          <select value={form.voucherTypeDefault} onChange={(e) => updateField('voucherTypeDefault', e.target.value)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">
            <option value="consumidor_final">Consumidor final</option>
            <option value="factura_a">Factura A</option>
            <option value="factura_b">Factura B</option>
            <option value="factura_c">Factura C</option>
          </select>

          <input value={form.iibb} onChange={(e) => updateField('iibb', e.target.value)} placeholder="Ingresos Brutos" className="rounded-xl border border-gray-300 px-4 py-3" />
          <input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email fiscal" className="rounded-xl border border-gray-300 px-4 py-3" />
          <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="Teléfono fiscal" className="rounded-xl border border-gray-300 px-4 py-3" />
          <input value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Ciudad" className="rounded-xl border border-gray-300 px-4 py-3" />
        </div>

        <textarea value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Domicilio fiscal" className="mt-4 min-h-[110px] w-full rounded-xl border border-gray-300 px-4 py-3" />

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => void handleSave()} disabled={saving || loading} className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar perfil fiscal'}
          </button>
        </div>
      </div>
    </div>
  );
}
