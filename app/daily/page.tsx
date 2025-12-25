"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NavBar } from "../../components/NavBar";
import { QuestionRenderer } from "../../components/QuestionRenderer";
import { TaskList } from "../../components/TaskList";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { Question, Section, Task } from "../../lib/types";
import { todayString } from "../../lib/date";
import { sortQuestionsByType } from "../../lib/questionOrder";
import { EditQuestionCard } from "../../components/EditQuestionCard";

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
  const [editMode, setEditMode] = useState(false);
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const { pushToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (searchParams.get("edit") === "1") {
      setEditMode(true);
    }
  }, [searchParams]);

  const loadEditQuestions = useCallback(async () => {
    setEditLoading(true);
    try {
      const response = await fetch("/api/questions?include_inactive=1");
      if (response.status === 401) {
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error("Failed to load questions");
      const json = await response.json();
      setEditQuestions(json.questions ?? []);
    } catch (error) {
      pushToast("Unable to load questions.", "error");
    } finally {
      setEditLoading(false);
    }
  }, [pushToast, router]);

  useEffect(() => {
    if (editMode) {
      loadEditQuestions();
    }
  }, [editMode, loadEditQuestions]);

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
    const source = editMode ? editQuestions : data.questions;
    return source.reduce((acc, question) => {
      acc[question.section_id] = acc[question.section_id] || [];
      acc[question.section_id].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [data, editMode, editQuestions]);

  const orderedQuestionsBySection = useMemo(() => {
    const next: Record<string, Question[]> = {};
    Object.entries(questionsBySection).forEach(([sectionId, questions]) => {
      next[sectionId] = sortQuestionsByType(questions);
    });
    return next;
  }, [questionsBySection]);

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
    }
    setSaving(false);
  }, [data, date, dirtyAnswers, pushToast]);

  useEffect(() => {
    const hasDirtyAnswers = Object.keys(dirtyAnswers).some((id) => dirtyAnswers[id]);
    if (!hasDirtyAnswers || saving) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void saveAnswers();
    }, 800);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [dirtyAnswers, saveAnswers, saving]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-fuchsia-50">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-48 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
      <NavBar
        activeName={data?.person?.display_name}
        date={date}
        onDateChange={setDate}
        onEditToggle={() => {
          setEditMode((prev) => {
            const next = !prev;
            if (prev) {
              router.replace("/daily");
            }
            return next;
          });
        }}
        isEditing={editMode}
      />
      <div className="container-shell relative space-y-10 py-8">
        {loading || !data ? (
          <Skeleton lines={6} />
        ) : (
          <>
            {editMode ? (
              <div className="space-y-8">
                <div className="rounded-2xl border border-indigo-200/70 bg-white/90 px-5 py-4 text-sm text-indigo-700 shadow-sm shadow-indigo-100">
                  Edit mode is on. Add, reorder, or update questions below. Answers are disabled.
                </div>
                {data.sections.map((section) => (
                  <section key={section.id} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                      <button
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                        onClick={async () => {
                          const current = editQuestions.filter(
                            (question) => question.section_id === section.id
                          );
                          const nextSort =
                            current.length === 0
                              ? 0
                              : Math.max(...current.map((q) => q.sort_order)) + 1;
                          const response = await fetch("/api/questions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              section_id: section.id,
                              prompt: "New question",
                              type: "checkbox",
                              sort_order: nextSort
                            })
                          });
                          if (!response.ok) {
                            pushToast("Unable to add question.", "error");
                            return;
                          }
                          await loadEditQuestions();
                        }}
                        type="button"
                      >
                        + Add Question
                      </button>
                    </div>
                    {editLoading ? (
                      <Skeleton lines={4} />
                    ) : (
                      <div className="grid gap-4">
                        {(orderedQuestionsBySection[section.id] ?? []).length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
                            No questions yet. Add one to get started.
                          </div>
                        ) : (
                          (orderedQuestionsBySection[section.id] ?? []).map((question) => (
                            <EditQuestionCard
                              key={question.id}
                              question={question}
                              onUpdate={async (id, payload) => {
                                const response = await fetch("/api/questions", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id, ...payload })
                                });
                                if (!response.ok) {
                                  pushToast("Unable to update question.", "error");
                                  return;
                                }
                                await loadEditQuestions();
                              }}
                              onDelete={async (id) => {
                                const response = await fetch("/api/questions", {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id })
                                });
                                if (!response.ok) {
                                  pushToast("Unable to delete question.", "error");
                                  return;
                                }
                                await loadEditQuestions();
                              }}
                              onMove={async (id, direction) => {
                                const response = await fetch("/api/questions/reorder", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ question_id: id, direction })
                                });
                                if (!response.ok) {
                                  pushToast("Unable to reorder question.", "error");
                                  return;
                                }
                                await loadEditQuestions();
                              }}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </section>
                ))}
                <div className="flex justify-end">
                  <button
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl"
                    onClick={() => {
                      setEditMode(false);
                      router.replace("/daily");
                    }}
                    type="button"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              <>
                {data.sections.map((section) => (
                  <section key={section.id} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {section.title}
                      </h2>
                      {section.key === "routine" && (
                        <p className="text-sm text-slate-500">
                          Completion: {data.routine_completion.done}/{data.routine_completion.total}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-lg shadow-slate-200/50 backdrop-blur transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl">
                      {(orderedQuestionsBySection[section.id] ?? []).map((question) => (
                        <div key={question.id} className="space-y-1">
                          <QuestionRenderer
                            question={question}
                            value={data.answers[question.id]}
                            onChange={(value) => updateAnswer(question, value)}
                          />
                        </div>
                      ))}
                    </div>

                    {section.key === "routine" && (
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Today’s tasks
                          </h3>
                          <TaskList tasks={data.tasks_today} onToggle={toggleTask} />
                          <TaskInput onSubmit={(title) => addTask(title, date)} />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-slate-900">
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
              </>
            )}
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
        className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
        onClick={submit}
        type="button"
      >
        Add
      </button>
    </div>
  );
}
