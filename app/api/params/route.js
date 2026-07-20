import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function PUT(req) {
  try {
    const body = await req.json();
    const { comisionRappi, margenDefault } = body;
    if (comisionRappi === undefined || margenDefault === undefined) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    await sql`
      INSERT INTO params (id, comision_rappi, margen_default)
      VALUES (1, ${comisionRappi}, ${margenDefault})
      ON CONFLICT (id) DO UPDATE SET
        comision_rappi = EXCLUDED.comision_rappi,
        margen_default = EXCLUDED.margen_default
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/params failed:", err);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
