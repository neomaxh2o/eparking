import Turno from '@/models/Turno';

export async function getTurnoAbiertoByOperator(operatorId: string) {
  return Turno.findOne({ operatorId, estado: 'abierto' }).sort({ fechaApertura: -1 });
}

export async function abrirTurno(operatorId: string, numeroCaja = 1) {
  const existente = await getTurnoAbiertoByOperator(operatorId);
  if (existente) {
    throw new Error('Ya existe un turno abierto para este operador.');
  }

  const turno = await Turno.create({
    operatorId,
    numeroCaja,
    fechaApertura: new Date(),
    estado: 'abierto',
    totalTurno: 0,
  });

  return turno;
}

export async function liquidarTurno(
  operatorId: string,
  payload: { efectivo: number; tarjeta: number; otros: number }
) {
  const turno = await getTurnoAbiertoByOperator(operatorId);
  if (!turno) {
    throw new Error('No existe un turno abierto para liquidar.');
  }

  const efectivo = Number(payload.efectivo ?? 0);
  const tarjeta = Number(payload.tarjeta ?? 0);
  const otros = Number(payload.otros ?? 0);
  const totalDeclarado = efectivo + tarjeta + otros;

  turno.liquidacion = {
    efectivo,
    tarjeta,
    otros,
    totalDeclarado,
    fechaLiquidacion: new Date(),
  };

  await turno.save();
  return turno;
}

export async function cerrarTurno(operatorId: string) {
  const turno = await getTurnoAbiertoByOperator(operatorId);
  if (!turno) {
    throw new Error('No existe un turno abierto para cerrar.');
  }

  const totalTurno = Number(turno.totalTurno ?? 0);
  const totalDeclarado = Number(turno.liquidacion?.totalDeclarado ?? 0);

  if (!turno.liquidacion) {
    throw new Error('Debe liquidar el turno antes de cerrarlo.');
  }

  if (totalTurno !== totalDeclarado) {
    throw new Error('La liquidación no coincide con el total del turno.');
  }

  turno.estado = 'cerrado';
  turno.fechaCierre = new Date();

  await turno.save();
  return turno;
}
