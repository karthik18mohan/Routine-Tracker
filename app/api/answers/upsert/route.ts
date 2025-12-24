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
  const { date, question_id: questionId, value } = body ?? {};

  if (!date || !questionId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: question, error } = await supabaseAdmin
    .from("questions")
    .select("id, type")
    .eq("id", questionId)
    .eq("person_id", personId)
    .single();

  if (error || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const payload: Record<string, unknown> = {
    person_id: personId,
    question_id: questionId,
    answer_date: date,
    updated_at: new Date().toISOString()
  };

  if (question.type === "checkbox") {
    payload.value_bool = Boolean(value);
  } else if (question.type === "number" || question.type === "rating") {
    payload.value_num = value === null || value === "" ? null : Number(value);
  } else if (
    question.type === "select" ||
    question.type === "text_short" ||
    question.type === "text_long"
  ) {
    payload.value_text = value === null ? "" : String(value);
  } else {
    payload.value_json = value;
  }

  const { error: upsertError } = await supabaseAdmin
    .from("answers")
    .upsert(payload, { onConflict: "person_id,question_id,answer_date" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
