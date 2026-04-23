import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import { liquidarTurno } from '@/modules/turnos/server/turno.logic';
import { serializeTurno } from '@/modules/caja/server/serializers';
import Turno from '@/models/Turno';
import TurnoLiquidacion from '@/models/TurnoLiquidacion';
import { buildAdminTurnoLiquidacion } from '@/modules/admin-caja/server/admin-turno-liquidacion';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json().catch(() => null);
    const turnoId = String(body?.turnoId ?? '').trim();
    const observacion = typeof body?.observacion === 'string' ? body.observacion : '';

    if (turnoId) {
      const turnoAdmin = await Turno.findById(turnoId);
      if (!turnoAdmin) {
        return NextResponse.json({ error: 'No existe el turno indicado para liquidar.' }, { status: 404 });
      }

      if (turnoAdmin.esCajaAdministrativa) {
        // Regla aplicada: la liquidación administrativa solo puede ejecutarla el usuario autenticado
        // con rol owner/admin sobre su propio turno administrativo; operatorId del body se ignora.
        if (!['admin', 'owner'].includes(String(session.user.role ?? ''))) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        if (String(turnoAdmin.operatorId) !== session.user.id) {
          return NextResponse.json({ error: 'El turno administrativo no pertenece al usuario autenticado.' }, { status: 403 });
        }

        if (String(turnoAdmin.estado) === 'liquidado') {
          const existing = await TurnoLiquidacion.findOne({ turnoId }).lean<Record<string, unknown> | null>();
          if (existing) {
            return NextResponse.json({ ok: true, turno: await serializeTurno(turnoAdmin), liquidacion: existing }, { status: 200 });
          }
          return NextResponse.json({ error: 'El turno ya fue liquidado.' }, { status: 409 });
        }

        const built = await buildAdminTurnoLiquidacion(turnoId, session.user.id, observacion);
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

    if (!['operator', 'admin', 'owner'].includes(String(session.user.role ?? ''))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const turno = await liquidarTurno(session.user.id, {
      efectivo: Number(body?.efectivo ?? 0),
      tarjeta: Number(body?.tarjeta ?? 0),
      otros: Number(body?.otros ?? 0),
      observacion: observacion || undefined,
    });

    return NextResponse.json(await serializeTurno(turno), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error liquidando turno' },
      { status: 400 }
    );
  }
}
