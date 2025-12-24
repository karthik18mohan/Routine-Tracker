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
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
        >
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.status === "done"}
              onChange={() => onToggle(task)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className={task.status === "done" ? "line-through text-slate-400" : ""}>
              {task.title}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
