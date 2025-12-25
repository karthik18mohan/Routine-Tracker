"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../lib/types";

type UpdatePayload = {
  prompt: string;
  type: Question["type"];
  options: Record<string, unknown>;
  is_active: boolean;
};

type EditQuestionCardProps = {
  question: Question;
  onUpdate: (id: string, payload: UpdatePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, direction: "up" | "down") => Promise<void>;
};

const buildChoicesText = (choices: unknown) =>
  Array.isArray(choices) ? choices.join("\n") : "";

const buildLabelsText = (labels: unknown) =>
  Array.isArray(labels) ? labels.join(", ") : "";

export function EditQuestionCard({ question, onUpdate, onDelete, onMove }: EditQuestionCardProps) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [type, setType] = useState<Question["type"]>(question.type);
  const [isActive, setIsActive] = useState(question.is_active);
  const [choicesText, setChoicesText] = useState(buildChoicesText(question.options?.choices));
  const [ratingMin, setRatingMin] = useState(
    typeof question.options?.min === "number" ? String(question.options.min) : "1"
  );
  const [ratingMax, setRatingMax] = useState(
    typeof question.options?.max === "number" ? String(question.options.max) : "5"
  );
  const [ratingLabels, setRatingLabels] = useState(buildLabelsText(question.options?.labels));
  const [numberMin, setNumberMin] = useState(
    typeof question.options?.min === "number" ? String(question.options.min) : ""
  );
  const [numberMax, setNumberMax] = useState(
    typeof question.options?.max === "number" ? String(question.options.max) : ""
  );
  const skipAutoSave = useRef(true);

  useEffect(() => {
    setPrompt(question.prompt);
    setType(question.type);
    setIsActive(question.is_active);
    setChoicesText(buildChoicesText(question.options?.choices));
    setRatingMin(typeof question.options?.min === "number" ? String(question.options.min) : "1");
    setRatingMax(typeof question.options?.max === "number" ? String(question.options.max) : "5");
    setRatingLabels(buildLabelsText(question.options?.labels));
    setNumberMin(typeof question.options?.min === "number" ? String(question.options.min) : "");
    setNumberMax(typeof question.options?.max === "number" ? String(question.options.max) : "");
    skipAutoSave.current = true;
  }, [question]);

  const payload = useMemo<UpdatePayload>(() => {
    const trimmedPrompt = prompt.trim() || "Untitled question";
    if (type === "select") {
      const choices = choicesText
        .split("\n")
        .map((choice) => choice.trim())
        .filter(Boolean);
      return { prompt: trimmedPrompt, type, options: { choices }, is_active: isActive };
    }
    if (type === "rating") {
      const min = Number(ratingMin);
      const max = Number(ratingMax);
      const safeMin =
        ratingMin.trim() !== "" && Number.isFinite(min) ? min : 1;
      const safeMax =
        ratingMax.trim() !== "" && Number.isFinite(max) ? max : safeMin;
      const labels = ratingLabels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
      return {
        prompt: trimmedPrompt,
        type,
        options: { min: Math.min(safeMin, safeMax), max: Math.max(safeMin, safeMax), labels },
        is_active: isActive
      };
    }
    if (type === "number") {
      const min = numberMin.trim() === "" ? undefined : Number(numberMin);
      const max = numberMax.trim() === "" ? undefined : Number(numberMax);
      const options: Record<string, number> = {};
      if (typeof min === "number" && Number.isFinite(min)) options.min = min;
      if (typeof max === "number" && Number.isFinite(max)) options.max = max;
      return { prompt: trimmedPrompt, type, options, is_active: isActive };
    }
    return { prompt: trimmedPrompt, type, options: {}, is_active: isActive };
  }, [choicesText, isActive, numberMax, numberMin, prompt, ratingLabels, ratingMax, ratingMin, type]);

  const hasChanges = useMemo(() => {
    if (question.prompt !== payload.prompt) return true;
    if (question.type !== payload.type) return true;
    if (question.is_active !== payload.is_active) return true;
    return JSON.stringify(question.options ?? {}) !== JSON.stringify(payload.options ?? {});
  }, [payload, question]);

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    if (!hasChanges) return;
    const handle = setTimeout(() => {
      void onUpdate(question.id, payload);
    }, 500);
    return () => clearTimeout(handle);
  }, [hasChanges, onUpdate, payload, question.id]);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Question prompt"
          />
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {!isActive && <span className="rounded-full bg-amber-100 px-2 py-0.5">Inactive</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
            onClick={() => onMove(question.id, "up")}
            type="button"
          >
            ↑
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
            onClick={() => onMove(question.id, "down")}
            type="button"
          >
            ↓
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-amber-600"
            onClick={() => setIsActive((prev) => !prev)}
            type="button"
          >
            {isActive ? "Disable" : "Enable"}
          </button>
          <button
            className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600"
            onClick={() => onDelete(question.id)}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <label className="space-y-1 text-xs font-semibold text-slate-500">
        <span>Question type</span>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as Question["type"])}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="checkbox">Checkbox</option>
          <option value="number">Number</option>
          <option value="rating">Rating</option>
          <option value="select">Select</option>
          <option value="text_short">Text (short)</option>
          <option value="text_long">Text (long)</option>
        </select>
      </label>

      {type === "select" && (
        <label className="space-y-1 text-xs font-semibold text-slate-500">
          <span>Choices (one per line)</span>
          <textarea
            rows={3}
            value={choicesText}
            onChange={(event) => setChoicesText(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
      )}

      {type === "rating" && (
        <div className="grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-2">
          <label className="space-y-1">
            <span>Min</span>
            <input
              type="number"
              value={ratingMin}
              onChange={(event) => setRatingMin(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="space-y-1">
            <span>Max</span>
            <input
              type="number"
              value={ratingMax}
              onChange={(event) => setRatingMax(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span>Labels (comma separated)</span>
            <input
              value={ratingLabels}
              onChange={(event) => setRatingLabels(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>
      )}

      {type === "number" && (
        <div className="grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-2">
          <label className="space-y-1">
            <span>Min (optional)</span>
            <input
              type="number"
              value={numberMin}
              onChange={(event) => setNumberMin(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="space-y-1">
            <span>Max (optional)</span>
            <input
              type="number"
              value={numberMax}
              onChange={(event) => setNumberMax(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>
      )}
    </div>
  );
}
