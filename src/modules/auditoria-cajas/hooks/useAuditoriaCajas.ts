import { useState, useEffect, useCallback } from 'react'
import { getCajas } from '../services/api'

export default function useAuditoriaCajas(){
  const [cajas,setCajas] = useState<any[]>([])
  const [summary,setSummary] = useState<any>({})
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<any>(null)
  const [intervalMs,setIntervalMs] = useState<number>(0)

  const fetch = useCallback(async ()=>{
    setLoading(true)
    try{
      const res = await getCajas()
      const cajasRaw = res.cajas || []
      const cajasNorm = cajasRaw.map((c:any) => {
        // normalize turno if present
        const turnoRaw = c.turno ?? null
        let turnoNorm = null
        if (turnoRaw) {
          try {
            const { adaptTurnoFromLegacy } = require('@/modules/turnos/adapters/turno.adapter')
            turnoNorm = adaptTurnoFromLegacy(turnoRaw)
          } catch (e) {
            // fallback: attempt best-effort normalization
            const estado = String((turnoRaw && turnoRaw.estado) || '').trim().toLowerCase()
            turnoNorm = { ...turnoRaw, estado: /abierto|open|en_curso/.test(estado) ? 'abierto' : estado }
          }
        }
        return {
          ...c,
          turno: turnoNorm ?? c.turno,
          turnoAbiertoNormalized: Boolean((turnoNorm && String(turnoNorm.estado).trim().toLowerCase() === 'abierto') || c.turnoAbierto || c.turnoId)
        }
      })
      setCajas(cajasNorm)
      setSummary(res.summary||{})
      setError(null)
    }catch(e){ setError(e) }
    setLoading(false)
  },[])

  useEffect(()=>{ fetch() },[fetch])

  useEffect(()=>{
    if(intervalMs>0){
      const id=setInterval(()=>fetch(), intervalMs)
      return ()=>clearInterval(id)
    }
  },[intervalMs,fetch])

  return { cajas, summary, loading, error, refresh: fetch, setAutoRefreshInterval: setIntervalMs }
}
