import { NextResponse } from "next/server";
import { checkPassword, authCookie } from "../../../lib/auth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const password = body?.password || "";

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", await authCookie());
  return res;
}
