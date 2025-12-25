"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "../../components/NavBar";
import { useToast } from "../../components/ToastProvider";
import { Skeleton } from "../../components/Skeleton";
import { format } from "date-fns";
import { todayString } from "../../lib/date";
import {
  CartesianGrid,
  Legend,
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
  trend?: { points: { date: string; value: number | null }[] };
  optionTrend?: { keys: string[]; points: { date: string; [key: string]: number | string }[] };
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
  const linePalette = [
    "var(--chart-series-1)",
    "var(--chart-series-2)",
    "var(--chart-series-3)",
    "var(--chart-series-4)",
    "var(--chart-series-5)"
  ];

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

  const buildTrendPoints = (points: { date: string; [key: string]: number | string | null }[]) =>
    points.map((point) => ({
      ...point,
      label: format(new Date(point.date), "MMM d")
    }));

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
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl transition group-hover:scale-110" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600 shadow-sm animate-[float_6s_ease-in-out_infinite]">
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M9 12l2 2 4-4"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <path
                            d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                      Task completion
                    </div>
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
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute -left-8 top-6 h-20 w-20 rounded-full bg-emerald-200/40 blur-2xl transition group-hover:scale-110" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm animate-[float_6s_ease-in-out_infinite]">
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M12 6v6l4 2"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </span>
                      Habit completion
                    </div>
                    <p className="text-sm text-slate-500">
                      Average completion across checkbox habits.
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">{averageCompletion}%</p>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute -bottom-10 right-6 h-24 w-24 rounded-full bg-fuchsia-200/40 blur-2xl transition group-hover:scale-110" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-50 text-fuchsia-600 shadow-sm animate-[float_6s_ease-in-out_infinite]">
                        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <path
                            d="M5 6h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                          <path
                            d="M7 10h6M7 14h4"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                      Journal activity
                    </div>
                    <p className="text-sm text-slate-500">Total journal entries in range.</p>
                    <p className="text-3xl font-semibold text-slate-900">{journalCount}</p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-sky-100/60 via-white/0 to-fuchsia-100/60" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-50 text-sky-600 shadow-sm animate-[float_6s_ease-in-out_infinite]">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 3s6 6.5 6 10a6 6 0 11-12 0c0-3.5 6-10 6-10z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </span>
                    Water (last 10 days)
                  </div>
                  <p className="text-sm text-slate-500">Daily liters logged.</p>
                </div>
                {waterTrend.length > 0 ? (
                  <div className="mt-4 h-56 text-[color:var(--chart-foreground)]">
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
                          strokeWidth={3}
                          dot={{ r: 4, fill: "var(--chart-accent)" }}
                          activeDot={{ r: 6 }}
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
                    className="group rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-medium">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M9 12l2 2 4-4"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </span>
                        {question.prompt}
                      </h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      Completion rate: {question.completion_rate}% | Current streak: {question.current_streak} days
                    </div>
                    {question.trend?.points?.length ? (
                      <div className="mt-4 h-32 text-[color:var(--chart-foreground)]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={buildTrendPoints(question.trend.points)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                            <XAxis dataKey="label" tick={chartAxisTick} />
                            <YAxis allowDecimals={false} tick={chartAxisTick} domain={[0, 1]} />
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
                              formatter={(value: number | null) =>
                                value === null ? "No entry" : value === 1 ? "Done" : "Missed"
                              }
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--chart-series-2)"
                              strokeWidth={2}
                              dot={{ r: 3, fill: "var(--chart-series-2)" }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : null}
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
                    className="group rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-medium">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-50 text-indigo-600 shadow-sm">
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M4 12h16M12 4v16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                        </span>
                        {question.prompt}
                      </h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    {question.type === "number" && question.stats && (
                      <>
                        <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                          <p>Avg: {question.stats.avg}</p>
                          <p>Sum: {question.stats.sum}</p>
                          <p>Min: {question.stats.min}</p>
                          <p>Max: {question.stats.max}</p>
                        </div>
                        {question.trend?.points?.length ? (
                          <div className="mt-4 h-40 text-[color:var(--chart-foreground)]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={buildTrendPoints(question.trend.points)}>
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
                                  stroke="var(--chart-series-1)"
                                  strokeWidth={2}
                                  dot={{ r: 3, fill: "var(--chart-series-1)" }}
                                  activeDot={{ r: 5 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : null}
                      </>
                    )}
                    {question.type === "rating" && question.optionTrend && (
                      <div className="mt-4 h-56 text-[color:var(--chart-foreground)]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={buildTrendPoints(question.optionTrend.points)}>
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
                            <Legend />
                            {question.optionTrend.keys.map((key, index) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={linePalette[index % linePalette.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            ))}
                          </LineChart>
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
                    className="group rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-medium">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-50 text-sky-600 shadow-sm">
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M8 6h12M8 12h12M8 18h12"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                          </svg>
                        </span>
                        {question.prompt}
                      </h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    {question.optionTrend && (
                      <div className="mt-4 h-56 text-[color:var(--chart-foreground)]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={buildTrendPoints(question.optionTrend.points)}>
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
                            <Legend />
                            {question.optionTrend.keys.map((key, index) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={linePalette[index % linePalette.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
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
                    className="group rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 font-medium">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-fuchsia-50 text-fuchsia-600 shadow-sm">
                          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                            <path
                              d="M9 8h6M9 12h6M9 16h4"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                        </span>
                        {question.prompt}
                      </h3>
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
