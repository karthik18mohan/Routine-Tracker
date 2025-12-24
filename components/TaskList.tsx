"use client";

import { Task } from "../lib/types";

type TaskListProps = {
  tasks: Task[];
  onToggle: (task: Task) => void;
};

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (!tasks.length) {
    return <p className="text-sm text-slate-500">No tasks yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-md shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40"
        >
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.status === "done"}
              onChange={() => onToggle(task)}
              className="h-5 w-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
            />
            <span
              className={
                task.status === "done"
                  ? "text-slate-400 line-through"
                  : "text-slate-700 dark:text-slate-100"
              }
            >
              {task.title}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
