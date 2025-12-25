"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "../../components/NavBar";
import { useToast } from "../../components/ToastProvider";
import { Skeleton } from "../../components/Skeleton";
import { format } from "date-fns";
import { todayString } from "../../lib/date";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type InsightQuestion = {
  id: string;
  prompt: string;
  type: "checkbox" | "number" | "rating" | "select" | "text_short" | "text_long";
  sort_order: number;
  completion_rate?: number;
  current_streak?: number;
  stats?: { avg: number; sum: number; min: number; max: number };
  distribution?: { label: string; count: number }[];
  count?: number;
  latest?: { date: string; value: string }[];
};

const ranges = ["week", "month", "year"] as const;

export default function InsightsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("week");
  const [anchor, setAnchor] = useState(todayString());
  const [data, setData] = useState<{
    person: { display_name: string };
    questions: InsightQuestion[];
    tasks: { completed: number; total: number; rate: number };
    waterTrend: { points: { date: string; value: number | null }[] } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();
  const router = useRouter();

  const chartAxisTick = { fill: "var(--chart-muted)", fontSize: 12 };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/insights?range=${range}&anchor=${anchor}`);
        if (response.status === 401) {
          router.push("/");
          return;
        }
        if (!response.ok) throw new Error("Failed insights");
        const json = await response.json();
        setData(json);
      } catch (error) {
        pushToast("Unable to load insights.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range, anchor, pushToast, router]);

  const orderedQuestions = useMemo(() => {
    if (!data?.questions) return [];
    const typeOrder: Record<InsightQuestion["type"], number> = {
      checkbox: 0,
      number: 1,
      rating: 1,
      select: 2,
      text_short: 3,
      text_long: 4
    };
    return [...data.questions].sort((a, b) => {
      const groupA = typeOrder[a.type] ?? 99;
      const groupB = typeOrder[b.type] ?? 99;
      if (groupA !== groupB) return groupA - groupB;
      return a.sort_order - b.sort_order;
    });
  }, [data]);

  const checkboxQuestions = useMemo(
    () => orderedQuestions.filter((question) => question.type === "checkbox"),
    [orderedQuestions]
  );
  const numberRatingQuestions = useMemo(
    () => orderedQuestions.filter((question) => question.type === "number" || question.type === "rating"),
    [orderedQuestions]
  );
  const selectQuestions = useMemo(
    () => orderedQuestions.filter((question) => question.type === "select"),
    [orderedQuestions]
  );
  const textQuestions = useMemo(
    () =>
      orderedQuestions.filter(
        (question) => question.type === "text_short" || question.type === "text_long"
      ),
    [orderedQuestions]
  );

  const waterTrend = useMemo(() => {
    if (!data?.waterTrend?.points) return [];
    return data.waterTrend.points.map((point) => ({
      ...point,
      label: format(new Date(point.date), "MMM d")
    }));
  }, [data]);

  const averageCompletion = useMemo(() => {
    if (!checkboxQuestions.length) return 0;
    const total = checkboxQuestions.reduce(
      (acc, q) => acc + (q.completion_rate ?? 0),
      0
    );
    return Math.round(total / checkboxQuestions.length);
  }, [checkboxQuestions]);

  const journalCount = useMemo(
    () => textQuestions.reduce((acc, q) => acc + (q.count ?? 0), 0),
    [textQuestions]
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <NavBar activeName={data?.person?.display_name} date={anchor} onDateChange={setAnchor} />
      <div className="container-shell space-y-8 py-8">
        <div className="flex flex-wrap items-center gap-3">
          {ranges.map((option) => (
            <button
              key={option}
              className={`rounded-md px-3 py-2 text-sm ${
                range === option ? "bg-slate-900 text-white" : "border border-slate-300"
              }`}
              onClick={() => setRange(option)}
              type="button"
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>

        {loading || !data ? (
          <Skeleton lines={6} />
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Overview</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Task completion</h3>
                    <p className="text-sm text-slate-500">
                      {data.tasks.completed}/{data.tasks.total} completed ({data.tasks.rate}%)
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500"
                        style={{ width: `${data.tasks.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Habit completion</h3>
                    <p className="text-sm text-slate-500">
                      Average completion across checkbox habits.
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">{averageCompletion}%</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Journal activity</h3>
                    <p className="text-sm text-slate-500">Total journal entries in range.</p>
                    <p className="text-3xl font-semibold text-slate-900">{journalCount}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Water (last 10 days)</h3>
                  <p className="text-sm text-slate-500">Daily liters logged.</p>
                </div>
                {waterTrend.length > 0 ? (
                  <div className="mt-4 h-48 text-[color:var(--chart-foreground)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={waterTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                        <XAxis dataKey="label" tick={chartAxisTick} />
                        <YAxis allowDecimals={false} tick={chartAxisTick} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: "var(--chart-grid)",
                            backgroundColor: "var(--chart-tooltip-bg)",
                            color: "var(--chart-foreground)"
                          }}
                          wrapperStyle={{ outline: "none" }}
                          labelStyle={{ color: "var(--chart-foreground)" }}
                          itemStyle={{ color: "var(--chart-foreground)" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--chart-accent)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "var(--chart-accent)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No water entries yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Checkbox habits</h2>
              <div className="grid gap-4">
                {checkboxQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{question.prompt}</h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      Completion rate: {question.completion_rate}% | Current streak: {question.current_streak} days
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Number & rating</h2>
              <div className="grid gap-4">
                {numberRatingQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{question.prompt}</h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    {question.type === "number" && question.stats && (
                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                        <p>Avg: {question.stats.avg}</p>
                        <p>Sum: {question.stats.sum}</p>
                        <p>Min: {question.stats.min}</p>
                        <p>Max: {question.stats.max}</p>
                      </div>
                    )}
                    {question.type === "rating" && (
                      <div className="mt-4 h-52 text-[color:var(--chart-foreground)]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={question.distribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="label" tick={chartAxisTick} />
                            <YAxis allowDecimals={false} tick={chartAxisTick} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                borderColor: "var(--chart-grid)",
                                backgroundColor: "var(--chart-tooltip-bg)",
                                color: "var(--chart-foreground)"
                              }}
                              wrapperStyle={{ outline: "none" }}
                              labelStyle={{ color: "var(--chart-foreground)" }}
                              itemStyle={{ color: "var(--chart-foreground)" }}
                            />
                            <Bar dataKey="count" fill="var(--chart-accent)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Select</h2>
              <div className="grid gap-4">
                {selectQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{question.prompt}</h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    <div className="mt-4 h-52 text-[color:var(--chart-foreground)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={question.distribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis dataKey="label" tick={chartAxisTick} />
                          <YAxis allowDecimals={false} tick={chartAxisTick} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              borderColor: "var(--chart-grid)",
                              backgroundColor: "var(--chart-tooltip-bg)",
                              color: "var(--chart-foreground)"
                            }}
                            wrapperStyle={{ outline: "none" }}
                            labelStyle={{ color: "var(--chart-foreground)" }}
                            itemStyle={{ color: "var(--chart-foreground)" }}
                          />
                          <Bar dataKey="count" fill="var(--chart-accent)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Journal text</h2>
              <div className="grid gap-4">
                {textQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{question.prompt}</h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      {question.count} entries in range.
                      {question.latest?.length ? (
                        <div className="mt-4 space-y-2">
                          {question.latest.map((entry) => (
                            <div key={entry.date}>
                              <p className="font-medium text-slate-700">
                                {format(new Date(entry.date), "PPP")}
                              </p>
                              <p>{entry.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
