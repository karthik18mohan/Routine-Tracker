import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const body = await request.json();
  const { title, due_date: dueDate } = body ?? {};

  if (!title || !dueDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("tasks").insert({
    person_id: personId,
    title,
    due_date: dueDate
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
