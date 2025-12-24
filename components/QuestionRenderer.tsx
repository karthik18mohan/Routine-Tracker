"use client";

import type { Question } from "../lib/types";

type QuestionRendererProps = {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
};

type RatingNumberOptions = { min?: number; max?: number };
type SelectOptions = { choices?: string[] };

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
    const options: RatingNumberOptions =
      (question.options as RatingNumberOptions | null | undefined) ?? {};

    return (
      <label className="space-y-1 text-sm">
        <span className="font-medium">{question.prompt}</span>
        <input
          type="number"
          min={options.min}
          max={options.max}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
          className={baseClass}
        />
      </label>
    );
  }

  if (question.type === "select") {
    const opts: SelectOptions = (question.options as SelectOptions | null | undefined) ?? {};
    const choices: string[] = Array.isArray(opts.choices) ? opts.choices : [];

    return (
      <label className="space-y-1 text-sm">
        <span className="font-medium">{question.prompt}</span>
        <select
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        >
          <option value="">Select...</option>
          {choices.map((choice: string) => (
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
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        />
      </label>
    );
  }

  // text_short fallback (and any unknown text-ish)
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium">{question.prompt}</span>
      <input
        type="text"
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
        className={baseClass}
      />
    </label>
  );
}
