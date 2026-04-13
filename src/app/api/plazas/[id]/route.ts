import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Plaza, { IPlaza, SubPlaza } from "@/models/Plaza/Plaza";

// ---------------------- GET /api/plazas/:id ----------------------
export async function GET(_req: Request, context: { params: { id: string; sub?: string } }) {
  try {
    const params = await context.params;
    const { id, sub } = params;

    await connectToDatabase();

    const plaza = await Plaza.findById(id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    if (sub) {
      const numero = parseInt(sub, 10);
      const subplaza: SubPlaza | undefined = plaza.plazasFisicas.find((sp: SubPlaza) => sp.numero === numero);
      if (!subplaza) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });
      return NextResponse.json(subplaza);
    }

    return NextResponse.json(plaza);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener plaza", details: error.message }, { status: 400 });
  }
}

// ---------------------- PATCH /api/plazas/:id ----------------------
export async function PATCH(req: Request, context: { params: { id: string; sub?: string } }) {
  try {
    const params = await context.params;
    const { id, sub } = params;

    await connectToDatabase();
    const body: Partial<IPlaza | SubPlaza> = await req.json();

    const plaza = await Plaza.findById(id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    if (sub) {
      const numero = parseInt(sub, 10);
      const index = plaza.plazasFisicas.findIndex((sp: SubPlaza) => sp.numero === numero);
      if (index === -1) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });

      plaza.plazasFisicas[index] = { ...(plaza.plazasFisicas[index].toObject() as SubPlaza), ...body };
      await plaza.save();
      return NextResponse.json(plaza.plazasFisicas[index]);
    }

    const updated = await Plaza.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar plaza", details: error.message }, { status: 400 });
  }
}

// ---------------------- DELETE /api/plazas/:id ----------------------
export async function DELETE(_req: Request, context: { params: { id: string; sub?: string } }) {
  try {
    const params = await context.params;
    const { id, sub } = params;

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
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar plaza", details: error.message }, { status: 400 });
  }
}

// ---------------------- POST /api/plazas/:id/subplaza ----------------------
export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const params = await context.params;
    const { id } = params;

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
