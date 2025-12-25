import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays
} from "date-fns";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

type RangeKey = "week" | "month" | "year";
type QuestionType =
  | "checkbox"
  | "number"
  | "rating"
  | "select"
  | "text_short"
  | "text_long";

type QuestionRow = {
  id: string;
  person_id: string;
  prompt: string;
  type: QuestionType;
  options: any;
  sort_order: number;
  is_active: boolean;
};

type AnswerRow = {
  question_id: string;
  answer_date: string; // YYYY-MM-DD
  value_bool: boolean | null;
  value_num: number | null;
  value_text: string | null;
  value_json: any;
};

type TaskRow = {
  id: string;
  status: "todo" | "done";
};

type PersonRow = {
  id: string;
  display_name: string;
};

const getRange = (range: RangeKey, anchor: string) => {
  const anchorDate = parseISO(anchor);
  if (range === "week") {
    return {
      start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
      end: endOfWeek(anchorDate, { weekStartsOn: 1 })
    };
  }
  if (range === "month") {
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  }
  return { start: startOfYear(anchorDate), end: endOfYear(anchorDate) };
};

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  const personId = cookies().get("active_person_id")?.value;
  if (!personId) {
    return NextResponse.json({ error: "No active person" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") as RangeKey) ?? "week";
  const anchor = searchParams.get("anchor") ?? format(new Date(), "yyyy-MM-dd");

  const { start, end } = getRange(range, anchor);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");
  const days = eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));

  const [personRes, questionsRes, answersRes, tasksRes] = await Promise.all([
    supabaseAdmin.from("people").select("id, display_name").eq("id", personId).maybeSingle(),
    supabaseAdmin
      .from("questions")
      .select("id, person_id, prompt, type, options, sort_order, is_active")
      .eq("person_id", personId)
      .eq("is_active", true)
      .order("sort_order"),
    supabaseAdmin
      .from("answers")
      .select("question_id, answer_date, value_bool, value_num, value_text, value_json")
      .eq("person_id", personId)
      .gte("answer_date", startStr)
      .lte("answer_date", endStr),
    supabaseAdmin
      .from("tasks")
      .select("id, status")
      .eq("person_id", personId)
      .gte("due_date", startStr)
      .lte("due_date", endStr)
  ]);

  if (personRes.error) {
    return NextResponse.json({ error: personRes.error.message }, { status: 500 });
  }
  if (questionsRes.error) {
    return NextResponse.json({ error: questionsRes.error.message }, { status: 500 });
  }
  if (answersRes.error) {
    return NextResponse.json({ error: answersRes.error.message }, { status: 500 });
  }
  if (tasksRes.error) {
    return NextResponse.json({ error: tasksRes.error.message }, { status: 500 });
  }

  const person = (personRes.data as PersonRow | null) ?? null;
  const questions = (questionsRes.data ?? []) as QuestionRow[];
  const answers = (answersRes.data ?? []) as AnswerRow[];
  const tasks = (tasksRes.data ?? []) as TaskRow[];

  const waterQuestion = questions.find(
    (question) => question.type === "number" && question.prompt.toLowerCase().includes("water")
  );
  const waterStart = subDays(parseISO(anchor), 9);
  const waterDays = eachDayOfInterval({ start: waterStart, end: parseISO(anchor) }).map((day) =>
    format(day, "yyyy-MM-dd")
  );
  let waterTrend: { question_id: string; points: { date: string; value: number | null }[] } | null =
    null;

  if (waterQuestion) {
    const waterAnswersRes = await supabaseAdmin
      .from("answers")
      .select("answer_date, value_num")
      .eq("person_id", personId)
      .eq("question_id", waterQuestion.id)
      .gte("answer_date", format(waterStart, "yyyy-MM-dd"))
      .lte("answer_date", format(parseISO(anchor), "yyyy-MM-dd"));

    if (waterAnswersRes.error) {
      return NextResponse.json({ error: waterAnswersRes.error.message }, { status: 500 });
    }

    const waterAnswers = (waterAnswersRes.data ?? []) as { answer_date: string; value_num: number | null }[];
    const waterByDate = waterAnswers.reduce((acc: Record<string, number | null>, answer) => {
      acc[answer.answer_date] = answer.value_num;
      return acc;
    }, {});

    waterTrend = {
      question_id: waterQuestion.id,
      points: waterDays.map((day) => ({
        date: day,
        value: waterByDate[day] ?? null
      }))
    };
  }

  const answersByQuestion = answers.reduce((acc: Record<string, AnswerRow[]>, ans: AnswerRow) => {
    (acc[ans.question_id] ??= []).push(ans);
    return acc;
  }, {} as Record<string, AnswerRow[]>);

  const questionStats = questions.map((question: QuestionRow) => {
    const questionAnswers: AnswerRow[] = answersByQuestion[question.id] ?? [];

    if (question.type === "checkbox") {
      const trueCount = questionAnswers.reduce(
        (acc: number, a: AnswerRow) => acc + (a.value_bool ? 1 : 0),
        0
      );

      const completionRate = days.length ? Math.round((trueCount / days.length) * 100) : 0;

      const answerByDate = questionAnswers.reduce((acc: Record<string, boolean>, a: AnswerRow) => {
        acc[a.answer_date] = Boolean(a.value_bool);
        return acc;
      }, {} as Record<string, boolean>);

      let streak = 0;
      for (let i = days.length - 1; i >= 0; i -= 1) {
        const dateKey = days[i];
        if (dateKey > anchor) continue; // don't count future days inside the window
        if (answerByDate[dateKey]) streak += 1;
        else break;
      }

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        sort_order: question.sort_order,
        completion_rate: completionRate,
        current_streak: streak
      };
    }

    if (question.type === "number") {
      const nums = questionAnswers
        .map((a: AnswerRow) => a.value_num)
        .filter((v: number | null): v is number => typeof v === "number" && Number.isFinite(v));

      const sum = nums.reduce((acc: number, v: number) => acc + v, 0);
      const avg = nums.length ? sum / nums.length : 0;
      const min = nums.length ? Math.min(...nums) : 0;
      const max = nums.length ? Math.max(...nums) : 0;

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        sort_order: question.sort_order,
        stats: {
          sum: Number(sum.toFixed(2)),
          avg: Number(avg.toFixed(2)),
          min,
          max
        }
      };
    }

    if (question.type === "rating" || question.type === "select") {
      const distribution: Record<string, number> = {};

      if (question.type === "rating") {
        const min = Number(question.options?.min ?? 1);
        const max = Number(question.options?.max ?? 5);
        const labels: string[] = Array.isArray(question.options?.labels)
          ? question.options.labels
          : [];

        for (let i = min; i <= max; i += 1) {
          const label = labels[i - min] ?? String(i);
          distribution[label] = 0;
        }

        questionAnswers.forEach((a: AnswerRow) => {
          if (typeof a.value_num !== "number") return;
          const idx = a.value_num - min;
          const label = labels[idx] ?? String(a.value_num);
          distribution[label] = (distribution[label] ?? 0) + 1;
        });
      } else {
        const choices: string[] = Array.isArray(question.options?.choices)
          ? question.options.choices
          : [];

        choices.forEach((choice: string) => {
          distribution[choice] = 0;
        });

        questionAnswers.forEach((a: AnswerRow) => {
          const label = a.value_text ?? "";
          if (!label) return;
          distribution[label] = (distribution[label] ?? 0) + 1;
        });
      }

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        sort_order: question.sort_order,
        distribution: Object.entries(distribution).map(([label, count]) => ({
          label,
          count
        }))
      };
    }

    if (question.type === "text_short" || question.type === "text_long") {
      const entries = questionAnswers
        .filter((a: AnswerRow) => Boolean(a.value_text))
        .sort((a: AnswerRow, b: AnswerRow) => (a.answer_date < b.answer_date ? 1 : -1))
        .slice(0, 10)
        .map((a: AnswerRow) => ({ date: a.answer_date, value: a.value_text ?? "" }));

      const count = questionAnswers.reduce(
        (acc: number, a: AnswerRow) => acc + (a.value_text ? 1 : 0),
        0
      );

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        sort_order: question.sort_order,
        count,
        latest: entries
      };
    }

    return {
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      sort_order: question.sort_order
    };
  });

  const completedTasks = tasks.reduce(
    (acc: number, t: TaskRow) => acc + (t.status === "done" ? 1 : 0),
    0
  );
  const totalTasks = tasks.length;

  return NextResponse.json({
    person,
    range,
    anchor,
    window: { start: startStr, end: endStr },
    waterTrend,
    questions: questionStats,
    tasks: {
      completed: completedTasks,
      total: totalTasks,
      rate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  });
}
