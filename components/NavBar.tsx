"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type NavBarProps = {
  activeName?: string;
  date: string;
  onDateChange?: (value: string) => void;
  onEditToggle?: () => void;
  isEditing?: boolean;
};

export function NavBar({ activeName, date, onDateChange, onEditToggle, isEditing }: NavBarProps) {
  const router = useRouter();

  const switchPerson = async () => {
    await fetch("/api/session/clear", { method: "POST" });
    router.push("/");
  };

  const iconButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-600 shadow-sm shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:text-slate-900 hover:shadow-md";

  const editLabel = useMemo(() => (isEditing ? "Done" : "Edit"), [isEditing]);

  return (
    <header className="border-b border-slate-200/70 bg-white/80 py-4 backdrop-blur">
      <div className="container-shell flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {onDateChange ? (
            <label className="flex items-center text-sm">
              <span className="sr-only">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="rounded-full border border-slate-200/70 bg-white/90 px-3 py-2 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          ) : (
            <div className="text-sm text-slate-500">{format(new Date(), "PPP")}</div>
          )}
          <Link className={iconButtonClass} href="/daily" aria-label="Daily">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </svg>
          </Link>
          <Link className={iconButtonClass} href="/insights" aria-label="Insights">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M7 15v-4" />
              <path d="M12 15v-7" />
              <path d="M17 15v-10" />
            </svg>
          </Link>
          <button className={iconButtonClass} onClick={switchPerson} type="button" aria-label="Switch person">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 11a4 4 0 1 0-8 0" />
              <path d="M4 21a8 8 0 0 1 16 0" />
              <path d="M20 6l2 2-2 2" />
              <path d="M22 8h-4" />
            </svg>
          </button>
          {onEditToggle && (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:text-slate-900 hover:shadow-md"
              onClick={onEditToggle}
              type="button"
            >
              {editLabel}
            </button>
          )}
        </div>
        <span className="sr-only">Active person: {activeName ?? "Select person"}</span>
      </div>
    </header>
  );
}
