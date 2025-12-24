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

  return (
    <header className="border-b border-slate-200/70 bg-white/80 py-4 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="container-shell flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-slate-500">Active</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {activeName ?? "Select person"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onDateChange ? (
            <label className="flex w-full items-center gap-2 text-sm sm:w-auto">
              <span className="text-slate-500">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="w-full rounded-full border border-slate-200/70 bg-white/90 px-3 py-2 text-sm shadow-sm shadow-slate-200/40 transition duration-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/40 dark:focus:border-indigo-300 dark:focus:ring-indigo-500/30 sm:w-auto"
              />
            </label>
          ) : (
            <div className="text-sm text-slate-500">{format(new Date(), "PPP")}</div>
          )}
          <Link
            className="w-full rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-center text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-slate-950/40 sm:w-auto"
            href="/insights"
          >
            Insights
          </Link>
          <button
            className="w-full rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-slate-950/40 sm:w-auto"
            onClick={switchPerson}
            type="button"
          >
            Switch person
          </button>
          <button
            className="w-full rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-slate-950/40 sm:w-auto"
            onClick={toggleTheme}
            type="button"
          >
            {dark ? "Light" : "Dark"} mode
          </button>
        </div>
      </div>
    </header>
  );
}
