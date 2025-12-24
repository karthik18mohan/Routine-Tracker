import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addDays, format, parseISO } from "date-fns";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

const toDate = (value?: string | null) => {
  if (!value) return format(new Date(), "yyyy-MM-dd");
  return value;
};

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = toDate(searchParams.get("date"));
  const tomorrow = format(addDays(parseISO(date), 1), "yyyy-MM-dd");

  const [{ data: person, error: personError }, { data: sections }, { data: questions }] =
    await Promise.all([
      supabaseAdmin.from("people").select("id, display_name").eq("id", personId).single(),
      supabaseAdmin.from("sections").select("*").order("sort_order"),
      supabaseAdmin
        .from("questions")
        .select("*")
        .eq("person_id", personId)
        .eq("is_active", true)
        .order("sort_order")
    ]);

  if (personError || !person) {
    return NextResponse.json({ error: "Invalid person" }, { status: 400 });
  }

  const { data: answers } = await supabaseAdmin
    .from("answers")
    .select("*")
    .eq("person_id", personId)
    .eq("answer_date", date);

  const { data: tasksToday } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("person_id", personId)
    .eq("due_date", date)
    .order("created_at");

  const { data: tasksTomorrow } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("person_id", personId)
    .eq("due_date", tomorrow)
    .order("created_at");

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q.type]));
  const answerMap: Record<string, unknown> = {};

  (answers ?? []).forEach((answer) => {
    const type = questionMap.get(answer.question_id);
    if (type === "checkbox") {
      answerMap[answer.question_id] = answer.value_bool ?? false;
    } else if (type === "number" || type === "rating") {
      answerMap[answer.question_id] = answer.value_num ?? null;
    } else if (type === "select" || type === "text_short" || type === "text_long") {
      answerMap[answer.question_id] = answer.value_text ?? "";
    } else {
      answerMap[answer.question_id] = answer.value_json ?? null;
    }
  });

  const routineSection = (sections ?? []).find((section) => section.key === "routine");
  const routineQuestions = (questions ?? []).filter(
    (q) => q.section_id === routineSection?.id && q.type === "checkbox"
  );
  const doneCount = routineQuestions.filter((q) => answerMap[q.id]).length;

  return NextResponse.json({
    person,
    sections: sections ?? [],
    questions: questions ?? [],
    answers: answerMap,
    tasks_today: tasksToday ?? [],
    tasks_tomorrow: tasksTomorrow ?? [],
    tomorrow_date: tomorrow,
    routine_completion: {
      done: doneCount,
      total: routineQuestions.length
    }
  });
}
