import React from 'react'

export default function CajaCard({ caja, onOpenTurno, onOpenReporte, onOpenDetalle }:{ caja:any, onOpenTurno:Function, onOpenReporte:Function, onOpenDetalle:Function }){
  return (
    <article style={{border:'1px solid #ddd',padding:12,marginBottom:12}} data-testid={`caja-card-${caja.id}`}>
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <div>
          <div><strong>{caja.code}</strong></div>
          <div>Operador: {caja.operador || '-'}</div>
          <div>Estado: {caja.turnoAbierto? 'Abierto':'Cerrado'}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button onClick={()=>onOpenTurno(caja.id)}>Abrir turno</button>
          <button onClick={()=>onOpenReporte(caja.turnoId)}>Abrir reporte</button>
          <button onClick={()=>onOpenDetalle(caja.id)}>Detalle</button>
        </div>
      </div>
      <details>
        <summary>Últimos movimientos</summary>
        <ul>
          {(caja.movimientos||[]).slice(0,5).map((m:any,i:number)=> <li key={i}>{m.tipo} {m.monto}</li>)}
        </ul>
      </details>
    </article>
  )
}
