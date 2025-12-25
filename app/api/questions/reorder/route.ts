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
  const questionId = body?.question_id as string | undefined;
  const direction = body?.direction as "up" | "down" | undefined;

  if (!questionId || (direction !== "up" && direction !== "down")) {
    return NextResponse.json({ error: "question_id and direction required" }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from("questions")
    .select("id, section_id, sort_order")
    .eq("id", questionId)
    .eq("person_id", personId)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const { data: questions, error } = await supabaseAdmin
    .from("questions")
    .select("id, sort_order")
    .eq("person_id", personId)
    .eq("section_id", current.section_id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = questions ?? [];
  const index = items.findIndex((item) => item.id === questionId);
  if (index === -1) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return NextResponse.json({ ok: true });
  }

  const currentItem = items[index];
  const targetItem = items[targetIndex];

  const updates = [
    supabaseAdmin
      .from("questions")
      .update({ sort_order: targetItem.sort_order })
      .eq("id", currentItem.id)
      .eq("person_id", personId),
    supabaseAdmin
      .from("questions")
      .update({ sort_order: currentItem.sort_order })
      .eq("id", targetItem.id)
      .eq("person_id", personId)
  ];

  const results = await Promise.all(updates);
  const updateError = results.find((result) => result.error)?.error;
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
