import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("people")
    .select("id, display_name")
    .order("display_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ people: data ?? [] });
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.json();
  const displayName = body?.display_name as string | undefined;

  if (!displayName?.trim()) {
    return NextResponse.json({ error: "display_name required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("people")
    .insert({ display_name: displayName.trim() })
    .select("id, display_name")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create person" }, { status: 500 });
  }

  return NextResponse.json({ person: data });
}
