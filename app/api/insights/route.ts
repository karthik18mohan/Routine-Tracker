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
  startOfYear
} from "date-fns";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

type RangeKey = "week" | "month" | "year";

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
  const days = eachDayOfInterval({ start, end }).map((day) => format(day, "yyyy-MM-dd"));

  const [{ data: person }, { data: questions }, { data: answers }, { data: tasks }] =
    await Promise.all([
      supabaseAdmin.from("people").select("id, display_name").eq("id", personId).single(),
      supabaseAdmin
        .from("questions")
        .select("*")
        .eq("person_id", personId)
        .eq("is_active", true)
        .order("sort_order"),
      supabaseAdmin
        .from("answers")
        .select("*")
        .eq("person_id", personId)
        .gte("answer_date", startStr)
        .lte("answer_date", endStr),
      supabaseAdmin
        .from("tasks")
        .select("*")
        .eq("person_id", personId)
        .gte("due_date", startStr)
        .lte("due_date", endStr)
    ]);

  const answersByQuestion = (answers ?? []).reduce((acc, answer) => {
    acc[answer.question_id] = acc[answer.question_id] || [];
    acc[answer.question_id].push(answer);
    return acc;
  }, {} as Record<string, any[]>);

  const questionStats = (questions ?? []).map((question) => {
    const questionAnswers = answersByQuestion[question.id] ?? [];

    if (question.type === "checkbox") {
      const trueCount = questionAnswers.filter((a) => a.value_bool).length;
      const completionRate = days.length
        ? Math.round((trueCount / days.length) * 100)
        : 0;

      const answerByDate = questionAnswers.reduce((acc, a) => {
        acc[a.answer_date] = a.value_bool;
        return acc;
      }, {} as Record<string, boolean>);

      let streak = 0;
      for (let i = days.length - 1; i >= 0; i -= 1) {
        const dateKey = days[i];
        if (dateKey > anchor) continue;
        if (answerByDate[dateKey]) {
          streak += 1;
        } else {
          break;
        }
      }

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        completion_rate: completionRate,
        current_streak: streak
      };
    }

    if (question.type === "number") {
      const nums = questionAnswers
        .map((a) => a.value_num)
        .filter((value) => typeof value === "number");

      const sum = nums.reduce((acc, value) => acc + value, 0);
      const avg = nums.length ? sum / nums.length : 0;
      const min = nums.length ? Math.min(...nums) : 0;
      const max = nums.length ? Math.max(...nums) : 0;

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
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
        const min = question.options?.min ?? 1;
        const max = question.options?.max ?? 5;
        const labels = question.options?.labels ?? [];
        for (let i = min; i <= max; i += 1) {
          const label = labels[i - min] ?? String(i);
          distribution[label] = 0;
        }
        questionAnswers.forEach((a) => {
          if (typeof a.value_num !== "number") return;
          const label = labels[a.value_num - min] ?? String(a.value_num);
          distribution[label] = (distribution[label] ?? 0) + 1;
        });
      } else {
        const choices = question.options?.choices ?? [];
        choices.forEach((choice: string) => {
          distribution[choice] = 0;
        });
        questionAnswers.forEach((a) => {
          const label = a.value_text;
          if (!label) return;
          distribution[label] = (distribution[label] ?? 0) + 1;
        });
      }

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        distribution: Object.entries(distribution).map(([label, count]) => ({ label, count }))
      };
    }

    if (question.type === "text_short" || question.type === "text_long") {
      const entries = questionAnswers
        .filter((a) => a.value_text)
        .sort((a, b) => (a.answer_date < b.answer_date ? 1 : -1))
        .slice(0, 10)
        .map((a) => ({ date: a.answer_date, value: a.value_text }));

      return {
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        count: questionAnswers.filter((a) => a.value_text).length,
        latest: entries
      };
    }

    return {
      id: question.id,
      prompt: question.prompt,
      type: question.type
    };
  });

  const completedTasks = (tasks ?? []).filter((task) => task.status === "done").length;
  const totalTasks = tasks?.length ?? 0;

  return NextResponse.json({
    person,
    range,
    anchor,
    window: { start: startStr, end: endStr },
    questions: questionStats,
    tasks: {
      completed: completedTasks,
      total: totalTasks,
      rate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  });
}
