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
      const cajasNorm = cajasRaw.map((c:any) => ({
        ...c,
        turnoAbiertoNormalized: Boolean(c.turnoAbierto || c.turnoId || (c.turno && /abierto|open/i.test(String(c.turno.estado || ''))))
      }))
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
