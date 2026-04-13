import React from 'react'

export default function BadgePlaya({ playaId, playaName, status }:{ playaId:string, playaName?:string, status?:string }){
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <span style={{background:'#eee',padding:'4px 8px',borderRadius:8}}>{playaName || playaId}</span>
      <span style={{fontSize:12,color:'#888'}}>{status || ''}</span>
    </div>
  )
}
