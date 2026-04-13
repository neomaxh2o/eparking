import Counter from '@/models/Counter';
import type { ITurno } from '@/models/Turno';

export function formatTurnoCode(cajaNumero: number, numeroTurno: number, subturnoNumero = 0) {
const caja = String(cajaNumero).padStart(2, '0');
const turno = String(numeroTurno).padStart(6, '0');
const subturno = String(subturnoNumero).padStart(2, '0');
return `CJ-${caja}-T-${turno}-S-${subturno}`;
}

export async function ensureTurnoIdentity(
operatorId: string,
numeroCaja = 1,
subturnoNumero = 0,
partial?: Partial<ITurno>,
) {
const numeroTurno =
partial?.numeroTurno && partial.numeroTurno > 0
? partial.numeroTurno
: (await Counter.findOneAndUpdate(
{ _id: 'turno_caja_global' },
{ $inc: { seq: 1 } },
{ new: true, upsert: true },
)).seq;

const cajaNumero = partial?.cajaNumero && partial.cajaNumero > 0 ? partial.cajaNumero : numeroCaja;
const codigoTurno =
partial?.codigoTurno && partial.codigoTurno.trim() !== ''
? partial.codigoTurno
: formatTurnoCode(cajaNumero, numeroTurno, subturnoNumero);

return {
cajaNumero,
numeroTurno,
subturnoNumero,
codigoTurno,
};
}
