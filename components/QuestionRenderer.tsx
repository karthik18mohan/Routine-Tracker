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
    "w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/30";

  if (question.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/80 px-3 py-2 text-sm shadow-sm shadow-slate-200/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/70 dark:shadow-slate-950/40">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
        />
        <span>{question.prompt}</span>
      </label>
    );
  }

  if (question.type === "number" || question.type === "rating") {
    const options: RatingNumberOptions =
      (question.options as RatingNumberOptions | null | undefined) ?? {};

    // IMPORTANT: input value must be string|number|undefined, not unknown/object
    const inputValue: string | number =
      value === null || value === undefined
        ? ""
        : typeof value === "number"
          ? value
          : typeof value === "string"
            ? value
            : "";

    return (
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-100">
          {question.prompt}
        </span>
        <input
          type="number"
          min={options.min}
          max={options.max}
          value={inputValue}
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

    const selectValue: string =
      value === null || value === undefined ? "" : typeof value === "string" ? value : String(value);

    return (
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-100">
          {question.prompt}
        </span>
        <select
          value={selectValue}
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
    const textValue: string = typeof value === "string" ? value : "";

    return (
      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-100">
          {question.prompt}
        </span>
        <textarea
          rows={5}
          value={textValue}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        />
      </label>
    );
  }

  // text_short fallback (and other text-ish)
  const shortValue: string =
    value === null || value === undefined ? "" : typeof value === "string" ? value : String(value);

  return (
  <label className="space-y-2 text-sm">
    <span className="font-medium text-slate-700 dark:text-slate-100">
      {question.prompt}
    </span>
    <input
      type="text"
      value={shortValue}
      onChange={(event) => onChange(event.target.value)}
        className={baseClass}
      />
    </label>
  );
}
