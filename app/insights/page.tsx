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

const ranges = ["week", "month", "year"] as const;

export default function InsightsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("week");
  const [anchor, setAnchor] = useState(todayString());
  const [data, setData] = useState<any>(null);
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

  const distributionCharts = useMemo(() => {
    if (!data?.questions) return [];
    return data.questions.filter((q: any) => q.type === "select" || q.type === "rating");
  }, [data]);

  const orderedQuestions = useMemo(() => {
    if (!data?.questions) return [];
    const nonDropdown = data.questions.filter(
      (question: any) => question.type !== "select" && question.type !== "rating"
    );
    const dropdown = data.questions.filter(
      (question: any) => question.type === "select" || question.type === "rating"
    );
    return [...nonDropdown, ...dropdown];
  }, [data]);

  const waterTrend = useMemo(() => {
    if (!data?.waterTrend?.points) return [];
    return data.waterTrend.points.map((point: any) => ({
      ...point,
      label: format(new Date(point.date), "MMM d")
    }));
  }, [data]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <NavBar activeName={data?.person?.display_name} date={anchor} onDateChange={setAnchor} />
      <div className="container-shell space-y-8 py-8">
        <div className="flex flex-wrap items-center gap-3">
          {ranges.map((option) => (
            <button
              key={option}
              className={`rounded-md px-3 py-2 text-sm ${
                range === option
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-300 dark:border-slate-700"
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
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Task completion</h3>
                    <p className="text-sm text-slate-500">
                      {data.tasks.completed}/{data.tasks.total} completed ({data.tasks.rate}%)
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/70">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500"
                        style={{ width: `${data.tasks.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40">
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
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Question insights</h2>
              <div className="grid gap-4">
                {orderedQuestions.map((question: any) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{question.prompt}</h3>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {question.type}
                      </span>
                    </div>
                    {question.type === "checkbox" && (
                      <div className="mt-3 text-sm text-slate-500">
                        Completion rate: {question.completion_rate}% | Current streak:{" "}
                        {question.current_streak} days
                      </div>
                    )}
                    {question.type === "number" && (
                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                        <p>Avg: {question.stats.avg}</p>
                        <p>Sum: {question.stats.sum}</p>
                        <p>Min: {question.stats.min}</p>
                        <p>Max: {question.stats.max}</p>
                      </div>
                    )}
                    {(question.type === "select" || question.type === "rating") && (
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
                    {(question.type === "text_long" || question.type === "text_short") && (
                      <div className="mt-3 text-sm text-slate-500">
                        {question.count} entries in range.
                        {question.latest?.length ? (
                          <div className="mt-4 space-y-2">
                            {question.latest.map((entry: any) => (
                              <div key={entry.date}>
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                  {format(new Date(entry.date), "PPP")}
                                </p>
                                <p>{entry.value}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {distributionCharts.length === 0 && (
              <p className="text-sm text-slate-500">No distribution charts in this range.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
