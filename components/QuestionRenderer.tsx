"use client";

import { Question } from "../lib/types";

type QuestionRendererProps = {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const baseClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700";

  if (question.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span>{question.prompt}</span>
      </label>
    );
  }

  if (question.type === "number" || question.type === "rating") {
    const options = question.options as { min?: number; max?: number };
    return (
      <label className="space-y-1 text-sm">
        <span className="font-medium">{question.prompt}</span>
        <input
          type="number"
          min={options?.min}
          max={options?.max}
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : Number(event.target.value))
          }
          className={baseClass}
        />
      </label>
    );
  }

  if (question.type === "select") {
    const choices = (question.options as { choices?: string[] })?.choices ?? [];
    return (
      <label className="space-y-1 text-sm">
        <span className="font-medium">{question.prompt}</span>
        <select
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        >
          <option value="">Select...</option>
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (question.type === "text_long") {
    return (
      <label className="space-y-1 text-sm">
        <span className="font-medium">{question.prompt}</span>
        <textarea
          rows={5}
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        />
      </label>
    );
  }

  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{question.prompt}</span>
      <input
        type="text"
        value={(value as string) ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={baseClass}
      />
    </label>
  );
}
