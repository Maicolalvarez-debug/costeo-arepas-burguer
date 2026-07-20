import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

// Crea o actualiza una receta y reemplaza su lista de ingredientes (upsert por id)
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, nombre, margen, items } = body;
    if (!id || !nombre || margen === undefined || !Array.isArray(items)) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const queries = [
      sql`
        INSERT INTO recipes (id, nombre, margen)
        VALUES (${id}, ${nombre}, ${margen})
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, margen = EXCLUDED.margen
      `,
      sql`DELETE FROM recipe_items WHERE recipe_id = ${id}`,
    ];
    for (const it of items) {
      queries.push(
        sql`INSERT INTO recipe_items (recipe_id, ingredient_id, cantidad) VALUES (${id}, ${it.ingredientId}, ${it.cantidad})`
      );
    }

    await sql.transaction(queries);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/recipes failed:", err);
    return NextResponse.json({ error: "No se pudo guardar la receta" }, { status: 500 });
  }
}
