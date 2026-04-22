import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import { liquidarTurno } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';
import Turno from '@/models/Turno';
import TurnoLiquidacion from '@/models/TurnoLiquidacion';
import { buildAdminTurnoLiquidacion } from '@/modules/admin-caja/server/admin-turno-liquidacion';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const operatorId = String(body?.operatorId ?? '').trim();
    const turnoId = String(body?.turnoId ?? '').trim();

    if (turnoId) {
      const turnoAdmin = await Turno.findById(turnoId);
      if (!turnoAdmin) {
        return NextResponse.json({ error: 'No existe el turno indicado para liquidar.' }, { status: 404 });
      }

      if (turnoAdmin.esCajaAdministrativa) {
        if (!operatorId) {
          return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
        }

        if (String(turnoAdmin.operatorId) !== operatorId) {
          return NextResponse.json({ error: 'El turno no pertenece al operador indicado.' }, { status: 403 });
        }

        if (String(turnoAdmin.estado) === 'liquidado') {
          const existing = await TurnoLiquidacion.findOne({ turnoId }).lean<Record<string, unknown> | null>();
          if (existing) {
            return NextResponse.json({ ok: true, turno: await serializeTurno(turnoAdmin), liquidacion: existing }, { status: 200 });
          }
          return NextResponse.json({ error: 'El turno ya fue liquidado.' }, { status: 409 });
        }

        const built = await buildAdminTurnoLiquidacion(turnoId, operatorId, typeof body?.observacion === 'string' ? body.observacion : '');
        const liquidacion = await TurnoLiquidacion.findOneAndUpdate(
          { turnoId },
          { $setOnInsert: built.payload },
          { new: true, upsert: true },
        );

        turnoAdmin.estado = 'liquidado';
        turnoAdmin.fechaCierre = built.payload.fechaCierre ?? new Date();
        turnoAdmin.totalTurno = built.payload.saldoTeorico;
        turnoAdmin.liquidacion = {
          efectivo: built.payload.totalEfectivo,
          tarjeta: built.payload.totalTarjeta,
          otros: built.payload.totalTransferencia + built.payload.totalOtros,
          totalDeclarado: built.payload.saldoDeclarado ?? built.payload.saldoTeorico,
          totalSistema: built.payload.saldoTeorico,
          diferencia: built.payload.diferenciaCaja ?? 0,
          tipoDiferencia: 'sin_diferencia',
          observacion: built.payload.observaciones,
          fechaLiquidacion: built.payload.fechaCierre ?? new Date(),
        };
        await turnoAdmin.save();

        return NextResponse.json({ ok: true, turno: await serializeTurno(turnoAdmin), liquidacion }, { status: 200 });
      }
    }

    if (!operatorId) {
      return NextResponse.json({ error: 'operatorId es requerido' }, { status: 400 });
    }

    const turno = await liquidarTurno(operatorId, {
      efectivo: Number(body?.efectivo ?? 0),
      tarjeta: Number(body?.tarjeta ?? 0),
      otros: Number(body?.otros ?? 0),
      observacion: typeof body?.observacion === 'string' ? body.observacion : undefined,
    });

    return NextResponse.json(await serializeTurno(turno), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error liquidando turno' },
      { status: 400 }
    );
  }
}
