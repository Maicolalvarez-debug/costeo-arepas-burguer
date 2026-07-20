import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await sql`DELETE FROM recipes WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recipes/[id] failed:", err);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
