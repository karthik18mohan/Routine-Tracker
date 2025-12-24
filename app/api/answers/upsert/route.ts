import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

type QuestionType =
  | "checkbox"
  | "number"
  | "rating"
  | "select"
  | "text_short"
  | "text_long";

type QuestionRow = {
  id: string;
  type: QuestionType;
};

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const date = body?.date as string | undefined;
  const questionId = body?.question_id as string | undefined;
  const value = body?.value;

  if (!date || !questionId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Use maybeSingle() to avoid awkward TS inference + handle missing row cleanly
  const qRes = await supabaseAdmin
    .from("questions")
    .select("id, type")
    .eq("id", questionId)
    .eq("person_id", personId)
    .maybeSingle();

  if (qRes.error) {
    return NextResponse.json({ error: qRes.error.message }, { status: 500 });
  }

  const question = (qRes.data as QuestionRow | null);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const payload: Record<string, unknown> = {
    person_id: personId,
    question_id: questionId,
    answer_date: date,
    updated_at: new Date().toISOString(),
    // initialize all value fields to null so old values don't stick around
    value_bool: null,
    value_num: null,
    value_text: null,
    value_json: null
  };

  switch (question.type) {
    case "checkbox": {
      payload.value_bool = Boolean(value);
      break;
    }
    case "number":
    case "rating": {
      payload.value_num =
        value === null || value === undefined || value === ""
          ? null
          : Number(value);
      break;
    }
    case "select":
    case "text_short":
    case "text_long": {
      payload.value_text =
        value === null || value === undefined ? "" : String(value);
      break;
    }
    default: {
      payload.value_json = value ?? null;
      break;
    }
  }

  const upsertRes = await supabaseAdmin
    .from("answers")
    .upsert(payload, { onConflict: "person_id,question_id,answer_date" });

  if (upsertRes.error) {
    return NextResponse.json({ error: upsertRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
