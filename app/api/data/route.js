import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET() {
  try {
    const [ingredients, recipes, items, paramsRows] = await Promise.all([
      sql`SELECT id, nombre, unidad, peso_vol AS "pesoVol", costo_total AS "costoTotal" FROM ingredients ORDER BY nombre`,
      sql`SELECT id, nombre, margen FROM recipes ORDER BY nombre`,
      sql`SELECT recipe_id AS "recipeId", ingredient_id AS "ingredientId", cantidad FROM recipe_items`,
      sql`SELECT comision_rappi AS "comisionRappi", margen_default AS "margenDefault" FROM params WHERE id = 1`,
    ]);

    const itemsByRecipe = {};
    for (const it of items) {
      if (!itemsByRecipe[it.recipeId]) itemsByRecipe[it.recipeId] = [];
      itemsByRecipe[it.recipeId].push({
        ingredientId: it.ingredientId,
        cantidad: Number(it.cantidad),
      });
    }

    const recipesOut = recipes.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      margen: Number(r.margen),
      items: itemsByRecipe[r.id] || [],
    }));

    const ingredientsOut = ingredients.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      unidad: i.unidad,
      pesoVol: Number(i.pesoVol),
      costoTotal: Number(i.costoTotal),
    }));

    const params = paramsRows[0]
      ? {
          comisionRappi: Number(paramsRows[0].comisionRappi),
          margenDefault: Number(paramsRows[0].margenDefault),
        }
      : { comisionRappi: 0.35, margenDefault: 100 };

    return NextResponse.json({ ingredients: ingredientsOut, recipes: recipesOut, params });
  } catch (err) {
    console.error("GET /api/data failed:", err);
    return NextResponse.json(
      { error: "No se pudo leer la base de datos. Revisa DATABASE_URL y que hayas corrido sql/schema.sql." },
      { status: 500 }
    );
  }
}
