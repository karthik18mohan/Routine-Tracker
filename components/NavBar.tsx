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
    <header className="border-b border-slate-200 bg-white/80 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container-shell flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-slate-500">Active</p>
          <p className="text-lg font-semibold">{activeName ?? "Select person"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onDateChange ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700"
              />
            </label>
          ) : (
            <div className="text-sm text-slate-500">{format(new Date(), "PPP")}</div>
          )}
          <Link
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            href="/insights"
          >
            Insights
          </Link>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            onClick={switchPerson}
            type="button"
          >
            Switch person
          </button>
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
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
