"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "../../components/NavBar";
import { useToast } from "../../components/ToastProvider";
import { Skeleton } from "../../components/Skeleton";
import { format } from "date-fns";
import { todayString } from "../../lib/date";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ranges = ["week", "month", "year"] as const;

export default function InsightsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("week");
  const [anchor, setAnchor] = useState(todayString());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();
  const router = useRouter();

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

  return (
    <main className="min-h-screen">
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
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Task completion</h2>
              <p className="text-sm text-slate-500">
                {data.tasks.completed}/{data.tasks.total} completed ({data.tasks.rate}%)
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Question insights</h2>
              <div className="grid gap-4">
                {data.questions.map((question: any) => (
                  <div
                    key={question.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{question.prompt}</h3>
                      <span className="text-xs text-slate-500">{question.type}</span>
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
                      <div className="mt-4 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={question.distribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0f172a" />
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
