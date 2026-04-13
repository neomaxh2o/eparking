import React from 'react'
import TopSummary from './components/TopSummary'
import BadgePlaya from './components/BadgePlaya'
import CajaCard from './components/CajaCard'
import useAuditoriaCajas from './hooks/useAuditoriaCajas'

export default function AuditoriaCajasSubtab(): JSX.Element {
  const { cajas, summary, loading, error, refresh, setAutoRefreshInterval } = useAuditoriaCajas()

  return (
    <section>
      <TopSummary summary={summary} onRefresh={refresh} setAutoRefreshInterval={setAutoRefreshInterval} />
      <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
        <BadgePlaya playaId={summary?.playaId || ''} playaName={summary?.playaName || '—'} />
      </div>

      <div>
        {loading && <div>Loading...</div>}
        {error && <div>Error: {String(error)}</div>}
        {cajas?.map((caja) => (
          <CajaCard key={caja.id} caja={caja} onOpenTurno={() => {}} onOpenReporte={() => {}} onOpenDetalle={() => {}} />
        ))}
      </div>
    </section>
  )
}
