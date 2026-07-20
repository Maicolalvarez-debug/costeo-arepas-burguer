import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

// Crea o actualiza un ingrediente (upsert por id)
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, nombre, unidad, pesoVol, costoTotal } = body;
    if (!id || !nombre || !unidad || pesoVol === undefined || costoTotal === undefined) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    await sql`
      INSERT INTO ingredients (id, nombre, unidad, peso_vol, costo_total)
      VALUES (${id}, ${nombre}, ${unidad}, ${pesoVol}, ${costoTotal})
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        unidad = EXCLUDED.unidad,
        peso_vol = EXCLUDED.peso_vol,
        costo_total = EXCLUDED.costo_total
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/ingredients failed:", err);
    return NextResponse.json({ error: "No se pudo guardar el ingrediente" }, { status: 500 });
  }
}
