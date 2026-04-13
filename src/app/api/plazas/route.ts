import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Plaza, { SubPlaza } from "@/models/Plaza/Plaza";
import { IPlaza } from "@/interfaces/Plaza/Plaza";
import { Types } from "mongoose";

// ---------------------- RUTA PRINCIPAL: /api/plazas/:id ----------------------

// GET todas las plazas
export async function GET() {
  await connectToDatabase();
  const plazas = await Plaza.find();
  console.log("GET /api/plazas → plazas obtenidas:", plazas);
  return NextResponse.json(plazas);
}

// PATCH actualizar plaza o subplaza
export async function PATCH(req: Request, { params }: { params: { id: string; sub?: string } }) {
  try {
    await connectToDatabase();
    const updates = await req.json();
    console.log("PATCH /api/plazas/:id → updates recibidos:", updates);

    const plaza = await Plaza.findById(params.id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    // Actualizar subplaza
    if (params.sub) {
      const numero = parseInt(params.sub, 10);
      const index = plaza.plazasFisicas.findIndex((sp: SubPlaza) => sp.numero === numero);
      if (index === -1) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });

      plaza.plazasFisicas[index] = { ...plaza.plazasFisicas[index].toObject(), ...updates };
      console.log(`Subplaza actualizada:`, plaza.plazasFisicas[index]);
      await plaza.save();
      return NextResponse.json(plaza.plazasFisicas[index]);
    }

    // Actualizar plaza completa (incluye nombre, descripcion, parkinglotId)
    const updated = await Plaza.findByIdAndUpdate(params.id, updates, { new: true, runValidators: true });
    console.log("Plaza completa actualizada:", updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error en PATCH /api/plazas/:id:", error);
    return NextResponse.json({ error: "Error al actualizar", details: (error as any).message }, { status: 400 });
  }
}

// DELETE eliminar plaza o subplaza
export async function DELETE(_req: Request, { params }: { params: { id: string; sub?: string } }) {
  try {
    await connectToDatabase();

    const plaza = await Plaza.findById(params.id);
    if (!plaza) return NextResponse.json({ error: "Plaza no encontrada" }, { status: 404 });

    if (params.sub) {
      const numero = parseInt(params.sub, 10);
      const index = plaza.plazasFisicas.findIndex((sp: SubPlaza) => sp.numero === numero);
      if (index === -1) return NextResponse.json({ error: "Subplaza no encontrada" }, { status: 404 });

      const deletedSub = plaza.plazasFisicas.splice(index, 1);
      console.log("Subplaza eliminada:", deletedSub[0]);
      await plaza.save();
      return NextResponse.json({ message: "Subplaza eliminada correctamente" });
    }

    await Plaza.findByIdAndDelete(params.id);
    console.log("Plaza eliminada correctamente:", params.id);
    return NextResponse.json({ message: "Plaza eliminada correctamente" });
  } catch (error) {
    console.error("Error en DELETE /api/plazas/:id:", error);
    return NextResponse.json({ error: "Error al eliminar", details: (error as any).message }, { status: 400 });
  }
}

// POST crear plaza nueva
export async function POST(req: Request) {
  try {
    await connectToDatabase();

    type PlazaBody = Partial<IPlaza> & {
      plazasFisicas?: any[];
      segmentaciones?: any[];
      descripcion?: string;
    };

    const data: PlazaBody = await req.json();
    console.log("POST /api/plazas → data recibida:", data);

    // Tomar categoría de nivel superior o de la primera segmentación
    let categoriaPlaza = data.categoria;
    if (!categoriaPlaza && data.segmentaciones?.length) {
      categoriaPlaza = data.segmentaciones[0].categoria;
    }

    if (!categoriaPlaza) {
      return NextResponse.json({ error: "Categoría requerida" }, { status: 400 });
    }

    // Mapear plazasFisicas y convertir estadiaId a ObjectId
    const plazasFisicas: SubPlaza[] = (data.plazasFisicas || []).map(sp => ({
      numero: sp.numero,
      estado: sp.estado || "disponible",
      ocupada: sp.ocupada ?? false,
      configurable: sp.configurable ?? true,
      usuarioAbonado: sp.usuarioAbonado ?? null,
      estadiaId: sp.estadiaId ? new Types.ObjectId(sp.estadiaId) : null,
      notas: sp.notas ?? "",
    }));

    console.log("Plazas físicas mapeadas:", plazasFisicas);

    const nuevaPlaza = new Plaza({
      categoria: categoriaPlaza,
      
      nombre: data.nombre ?? `Playa ${categoriaPlaza}`,
      descripcion: data.descripcion ?? "",
      plazasFisicas,
      parkinglotId: data.parkinglotId ? new Types.ObjectId(data.parkinglotId) : null,
      configurable: data.configurable ?? true,
    });

    // Manejar segmentaciones si vienen en el body
    if (data.segmentaciones && Array.isArray(data.segmentaciones)) {
      const segmentaciones = data.segmentaciones.map(seg => ({
        ...seg,
        plazas: (seg.plazas || []).map(sp => ({
          ...sp,
          estadiaId: sp.estadiaId ? new Types.ObjectId(sp.estadiaId) : null,
        })),
      }));
      nuevaPlaza.set("segmentaciones", segmentaciones);
      console.log("Segmentaciones procesadas:", segmentaciones);
    }

    await nuevaPlaza.save();
    console.log("Nueva plaza guardada en DB:", nuevaPlaza);

    return NextResponse.json(nuevaPlaza, { status: 201 });
  } catch (error: any) {
    console.error("Error en POST /api/plazas:", error);
    return NextResponse.json({ error: "Error al crear plaza", details: error.message }, { status: 400 });
  }
}
