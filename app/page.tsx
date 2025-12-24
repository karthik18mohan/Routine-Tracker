"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/ToastProvider";

type Person = { id: string; display_name: string };

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { pushToast } = useToast();

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const response = await fetch("/api/people");
        if (!response.ok) throw new Error("Failed to load people");
        const data = await response.json();
        setPeople(data.people ?? []);
      } catch (error) {
        pushToast("Unable to load people.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadPeople();
  }, [pushToast]);

  const selectPerson = async (personId: string) => {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: personId })
    });

    if (response.ok) {
      router.push("/daily");
    } else {
      pushToast("Unable to set session.", "error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container-shell flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-sm uppercase text-slate-500">Welcome</p>
          <h1 className="text-3xl font-semibold">Select your name</h1>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading people...</p>
        ) : (
          <div className="grid w-full max-w-md gap-3">
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => selectPerson(person.id)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {person.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
