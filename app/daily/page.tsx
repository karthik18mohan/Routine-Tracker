"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "../../components/NavBar";
import { QuestionRenderer } from "../../components/QuestionRenderer";
import { TaskList } from "../../components/TaskList";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { Question, Section, Task } from "../../lib/types";
import { todayString } from "../../lib/date";

type DailyResponse = {
  person: { id: string; display_name: string };
  sections: Section[];
  questions: Question[];
  answers: Record<string, unknown>;
  tasks_today: Task[];
  tasks_tomorrow: Task[];
  tomorrow_date: string;
  routine_completion: { done: number; total: number };
};

export default function DailyPage() {
  const [date, setDate] = useState(todayString());
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirtyAnswers, setDirtyAnswers] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/daily?date=${date}`);
      if (response.status === 401) {
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error("Failed to load daily data");
      const json = await response.json();
      setData(json);
      setDirtyAnswers({});
      setSaving(false);
    } catch (error) {
      pushToast("Unable to load daily data.", "error");
    } finally {
      setLoading(false);
    }
  }, [date, pushToast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateAnswer = (question: Question, value: unknown) => {
    if (!data) return;
    setData({ ...data, answers: { ...data.answers, [question.id]: value } });
    setDirtyAnswers((prev) => ({ ...prev, [question.id]: true }));
  };

  const addTask = async (title: string, dueDate: string) => {
    const response = await fetch("/api/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_date: dueDate })
    });

    if (!response.ok) {
      pushToast("Unable to add task.", "error");
      return;
    }

    await loadData();
  };

  const toggleTask = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const response = await fetch("/api/tasks/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, status: nextStatus })
    });
    if (!response.ok) {
      pushToast("Unable to update task.", "error");
      return;
    }
    await loadData();
  };

  const questionsBySection = useMemo(() => {
    if (!data) return {} as Record<string, Question[]>;
    return data.questions.reduce((acc, question) => {
      acc[question.section_id] = acc[question.section_id] || [];
      acc[question.section_id].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [data]);

  const saveAnswers = useCallback(async () => {
    if (!data) return;
    const dirtyIds = Object.keys(dirtyAnswers).filter((id) => dirtyAnswers[id]);
    if (!dirtyIds.length) return;
    setSaving(true);
    const results = await Promise.all(
      dirtyIds.map(async (id) => {
        const response = await fetch("/api/answers/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, question_id: id, value: data.answers[id] })
        });
        return { id, ok: response.ok };
      })
    );
    const failed = results.filter((result) => !result.ok);
    setDirtyAnswers((prev) => {
      const next = { ...prev };
      results.forEach((result) => {
        if (result.ok) {
          delete next[result.id];
        }
      });
      return next;
    });
    if (failed.length) {
      pushToast("Unable to save some answers.", "error");
    } else {
      pushToast("Answers saved.", "success");
    }
    setSaving(false);
  }, [data, date, dirtyAnswers, pushToast]);

  const hasDirtyAnswers = Object.keys(dirtyAnswers).some((id) => dirtyAnswers[id]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl dark:bg-fuchsia-500/20" />
      <NavBar activeName={data?.person?.display_name} date={date} onDateChange={setDate} />
      <div className="container-shell relative space-y-10 py-8">
        {loading || !data ? (
          <Skeleton lines={6} />
        ) : (
          <>
            {data.sections.map((section) => (
              <section key={section.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {section.title}
                  </h2>
                  {section.key === "routine" && (
                    <p className="text-sm text-slate-500">
                      Completion: {data.routine_completion.done}/{data.routine_completion.total}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-lg shadow-slate-200/50 backdrop-blur transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40">
                  {(questionsBySection[section.id] ?? []).map((question) => (
                    <div key={question.id} className="space-y-1">
                      <QuestionRenderer
                        question={question}
                        value={data.answers[question.id]}
                        onChange={(value) => updateAnswer(question, value)}
                      />
                      {dirtyAnswers[question.id] && (
                        <p className="text-xs font-medium text-amber-500">
                          Unsaved changes
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {section.key === "routine" && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Today’s tasks
                      </h3>
                      <TaskList tasks={data.tasks_today} onToggle={toggleTask} />
                      <TaskInput onSubmit={(title) => addTask(title, date)} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Plan tomorrow
                      </h3>
                      <TaskList tasks={data.tasks_tomorrow} onToggle={toggleTask} />
                      <TaskInput
                        onSubmit={(title) => addTask(title, data.tomorrow_date)}
                        placeholder="Add task for tomorrow"
                      />
                    </div>
                  </div>
                )}
              </section>
            ))}
            <div className="sticky bottom-4 z-10 flex justify-center">
              <div className="flex w-full max-w-3xl flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur transition duration-300 dark:border-slate-800/70 dark:bg-slate-900/90 dark:shadow-slate-950/40 sm:flex-row sm:justify-between">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {hasDirtyAnswers
                    ? "You have unsaved answers."
                    : "All answers are saved."}
                </div>
                <button
                  className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  onClick={saveAnswers}
                  type="button"
                  disabled={saving || !hasDirtyAnswers}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

type TaskInputProps = {
  onSubmit: (title: string) => void;
  placeholder?: string;
};

function TaskInput({ onSubmit, placeholder }: TaskInputProps) {
  const [value, setValue] = useState("");

  const submit = async () => {
    if (!value.trim()) return;
    await onSubmit(value.trim());
    setValue("");
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/30"
        placeholder={placeholder ?? "Add task for today"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button
        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 dark:bg-slate-100 dark:text-slate-900 dark:shadow-slate-900/10"
        onClick={submit}
        type="button"
      >
        Add
      </button>
    </div>
  );
}
