"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "../../components/NavBar";
import { QuestionRenderer } from "../../components/QuestionRenderer";
import { TaskList } from "../../components/TaskList";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { Question, Section, Task } from "../../lib/types";
import { todayString } from "../../lib/date";

const debounceMs = 400;

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
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const { pushToast } = useToast();
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
    setSaving((prev) => ({ ...prev, [question.id]: true }));

    if (timersRef.current[question.id]) {
      clearTimeout(timersRef.current[question.id]);
    }

    timersRef.current[question.id] = setTimeout(async () => {
      await fetch("/api/answers/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, question_id: question.id, value })
      });
      setSaving((prev) => ({ ...prev, [question.id]: false }));
    }, debounceMs);
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

  return (
    <main className="min-h-screen">
      <NavBar activeName={data?.person?.display_name} date={date} onDateChange={setDate} />
      <div className="container-shell space-y-10 py-8">
        {loading || !data ? (
          <Skeleton lines={6} />
        ) : (
          <>
            {data.sections.map((section) => (
              <section key={section.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  {section.key === "routine" && (
                    <p className="text-sm text-slate-500">
                      Completion: {data.routine_completion.done}/{data.routine_completion.total}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  {(questionsBySection[section.id] ?? []).map((question) => (
                    <div key={question.id} className="space-y-1">
                      <QuestionRenderer
                        question={question}
                        value={data.answers[question.id]}
                        onChange={(value) => updateAnswer(question, value)}
                      />
                      {saving[question.id] && (
                        <p className="text-xs text-slate-400">Saving...</p>
                      )}
                    </div>
                  ))}
                </div>

                {section.key === "routine" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Today’s tasks</h3>
                      <TaskList tasks={data.tasks_today} onToggle={toggleTask} />
                      <TaskInput onSubmit={(title) => addTask(title, date)} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Plan tomorrow</h3>
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
    <div className="flex gap-2">
      <input
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
        placeholder={placeholder ?? "Add task for today"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
        onClick={submit}
        type="button"
      >
        Add
      </button>
    </div>
  );
}
