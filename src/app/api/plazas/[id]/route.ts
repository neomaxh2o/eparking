import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Plaza, { IPlaza, SubPlaza } from "@/models/Plaza/Plaza";

// ---------------------- GET /api/plazas/:id ----------------------
import { NextRequest } from 'next/server';
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string; sub?: string }> }) {
  try {
    const { id, sub } = await context.params;

    await connectToDatabase();

    const plaza = await Plaza.findById(id).lean<Record<string, unknown> | null>();
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    if (sub) {
      const numero = parseInt(sub, 10);
      const subplaza = (plaza.plazasFisicas as any[]).find((sp) => sp.numero === numero);
      if (!subplaza) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });
      return NextResponse.json(subplaza);
    }

    return NextResponse.json(plaza);
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error al obtener plaza", details: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

// ---------------------- PATCH /api/plazas/:id ----------------------
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string; sub?: string }> }) {
  try {
    const { id, sub } = await context.params;

    await connectToDatabase();
    const raw: unknown = await req.json().catch(() => null);
    const body = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};

    const plaza = await Plaza.findById(id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    if (sub) {
      const numero = parseInt(sub, 10);
      const index = plaza.plazasFisicas.findIndex((sp: SubPlaza) => sp.numero === numero);
      if (index === -1) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });

      plaza.plazasFisicas[index] = { ...(plaza.plazasFisicas[index].toObject() as SubPlaza), ...(body as Partial<SubPlaza>) };
      await plaza.save();
      return NextResponse.json(plaza.plazasFisicas[index]);
    }

    const updated = await Plaza.findByIdAndUpdate(id, body as Partial<IPlaza>, { new: true, runValidators: true }).lean<Record<string, unknown> | null>();
    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error al actualizar plaza", details: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

// ---------------------- DELETE /api/plazas/:id ----------------------
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string; sub?: string }> }) {
  try {
    const { id, sub } = await context.params;

    await connectToDatabase();

    const plaza = await Plaza.findById(id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    if (sub) {
      const numero = parseInt(sub, 10);
      const index = plaza.plazasFisicas.findIndex((sp: SubPlaza) => sp.numero === numero);
      if (index === -1) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });

      plaza.plazasFisicas.splice(index, 1);
      await plaza.save();
      return NextResponse.json({ message: "Subplaza eliminada correctamente" });
    }

    await Plaza.findByIdAndDelete(id);
    return NextResponse.json({ message: "Plaza eliminada correctamente" });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Error al eliminar plaza", details: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

// ---------------------- POST /api/plazas/:id/subplaza ----------------------
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    const plaza = await Plaza.findById(id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    const data: Partial<SubPlaza> = await req.json();
    const nextNumero: number = plaza.plazasFisicas.length ? Math.max(...plaza.plazasFisicas.map((sp: SubPlaza) => sp.numero)) + 1 : 1;

    const newSub: SubPlaza = {
      numero: data.numero ?? nextNumero,
      estado: data.estado ?? "disponible",
      ocupada: data.ocupada ?? false,
      configurable: data.configurable ?? true,
      usuarioAbonado: data.usuarioAbonado ?? null,
      estadiaId: data.estadiaId ?? null,
      notas: data.notas ?? "",
    };

    plaza.plazasFisicas.push(newSub);
    await plaza.save();

    return NextResponse.json(newSub, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al crear subplaza", details: error.message }, { status: 400 });
  }
}
