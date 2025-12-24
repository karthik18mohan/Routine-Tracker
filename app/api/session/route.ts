import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const personId = body?.person_id as string | undefined;

  if (!personId) {
    return NextResponse.json({ error: "person_id required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("people")
    .select("id")
    .eq("id", personId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid person" }, { status: 400 });
  }

  cookies().set("active_person_id", personId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  return NextResponse.json({ ok: true });
}
