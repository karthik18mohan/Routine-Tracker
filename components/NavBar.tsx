"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type NavBarProps = {
  activeName?: string;
  date: string;
  onDateChange?: (value: string) => void;
};

export function NavBar({ activeName, date, onDateChange }: NavBarProps) {
  const [dark, setDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const switchPerson = async () => {
    await fetch("/api/session/clear", { method: "POST" });
    router.push("/");
  };

  const iconButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-600 shadow-sm shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:text-slate-900 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-200 dark:shadow-slate-950/40 dark:hover:border-indigo-400/50 dark:hover:text-white";

  return (
    <header className="border-b border-slate-200/70 bg-white/80 py-4 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="container-shell flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {onDateChange ? (
            <label className="flex items-center text-sm">
              <span className="sr-only">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="rounded-full border border-slate-200/70 bg-white/90 px-3 py-2 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/30"
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
          <button className={iconButtonClass} onClick={toggleTheme} type="button" aria-label="Toggle theme">
            {dark ? (
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
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M4.93 19.07l1.41-1.41" />
                <path d="M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
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
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
        <span className="sr-only">Active person: {activeName ?? "Select person"}</span>
      </div>
    </header>
  );
}
