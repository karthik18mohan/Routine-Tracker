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
    "w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  if (question.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/80 px-3 py-2 text-sm shadow-sm shadow-slate-200/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
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

  if (question.type === "rating") {
    const options: RatingNumberOptions & { labels?: string[] } =
      (question.options as (RatingNumberOptions & { labels?: string[] }) | null | undefined) ??
      {};
    const isMood = question.prompt.toLowerCase().includes("mood");
    const defaultMoodIcons = ["😞", "🙁", "😐", "🙂", "😊", "😁"];

    if (isMood) {
      const rawLabels = Array.isArray(options.labels) ? options.labels : defaultMoodIcons;
      const moodLabels =
        rawLabels.length >= 6
          ? rawLabels.slice(0, 6)
          : [...rawLabels, ...defaultMoodIcons.slice(rawLabels.length, 6)];
      const selectValue =
        value === null || value === undefined
          ? ""
          : typeof value === "number"
            ? String(value)
            : typeof value === "string"
              ? value
              : "";

      return (
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">{question.prompt}</span>
          <select
            value={selectValue}
            onChange={(event) => {
              const raw = event.target.value;
              onChange(raw === "" ? null : Number(raw));
            }}
            className={baseClass}
          >
            <option value="">Select...</option>
            {moodLabels.map((label, idx) => (
              <option key={`${label}-${idx}`} value={String(idx + 1)}>
                {label}
              </option>
            ))}
          </select>
        </label>
      );
    }

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
        <span className="font-medium text-slate-700">{question.prompt}</span>
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

  if (question.type === "number") {
    const options: RatingNumberOptions =
      (question.options as RatingNumberOptions | null | undefined) ?? {};

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
        <span className="font-medium text-slate-700">{question.prompt}</span>
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
        <span className="font-medium text-slate-700">{question.prompt}</span>
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
        <span className="font-medium text-slate-700">{question.prompt}</span>
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
      <span className="font-medium text-slate-700">{question.prompt}</span>
      <input
        type="text"
        value={shortValue}
        onChange={(event) => onChange(event.target.value)}
        className={baseClass}
      />
    </label>
  );
}
