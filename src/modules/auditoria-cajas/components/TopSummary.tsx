import React from 'react'

type Summary = {
  totalCajas?: number
  abiertas?: number
  lastUpdated?: string
}

export default function TopSummary({ summary, onRefresh, setAutoRefreshInterval }:{ summary?: Summary, onRefresh?: ()=>void, setAutoRefreshInterval?: (ms:number)=>void }){
  return (
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div>
        <h3>Auditoría cajas</h3>
        <div>Totales: {summary?.totalCajas ?? '-'} • Abiertas: {summary?.abiertas ?? '-'}</div>
        <div style={{fontSize:12,color:'#666'}}>Última: {summary?.lastUpdated ?? '—'}</div>
      </div>
      <div>
        <button onClick={()=>onRefresh && onRefresh()}>Refresh</button>
        <select onChange={(e)=> setAutoRefreshInterval && setAutoRefreshInterval(Number(e.target.value)) }>
          <option value={0}>Auto-refresh: Off</option>
          <option value={15000}>15s</option>
          <option value={30000}>30s</option>
          <option value={60000}>60s</option>
        </select>
      </div>
    </header>
  )
}
