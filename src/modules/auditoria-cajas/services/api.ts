import axios from 'axios'

export async function getCajas(params?:any){
  const res = await axios.get('/api/v2/cajas/online', { params })
  return res.data
}

export async function postAbrirTurno(cajaId:string){
  const res = await axios.post('/api/v2/turno/abrir', { cajaId })
  return res.data
}

export async function getReporte(turnoId:string){
  const res = await axios.get(`/api/v2/turno-reportes/${turnoId}`)
  return res.data
}

export async function getDetalleCaja(cajaId:string){
  const res = await axios.get(`/api/v2/cajas/${cajaId}`)
  return res.data
}
