import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function POST() {
  try {
    await sql.transaction([
      sql`DELETE FROM recipe_items`,
      sql`DELETE FROM recipes`,
      sql`DELETE FROM ingredients`,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/clear-all failed:", err);
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 });
  }
}
