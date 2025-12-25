"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/ToastProvider";

type Person = { id: string; display_name: string };

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
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

  const createPerson = async () => {
    if (!newName.trim()) {
      pushToast("Name is required.", "error");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: newName.trim() })
      });
      if (!response.ok) {
        throw new Error("Unable to create person");
      }
      const data = await response.json();
      const personId = data?.person?.id as string | undefined;
      if (!personId) throw new Error("Missing person id");
      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId })
      });
      if (!sessionRes.ok) throw new Error("Unable to set session");
      router.push("/daily?edit=1");
    } catch (error) {
      pushToast("Unable to create person.", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container-shell flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-sm uppercase text-slate-500">Welcome</p>
          <h1 className="text-3xl font-semibold">Select your name</h1>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading people...</p>
        ) : (
          <div className="grid w-full max-w-md gap-4">
            <div className="grid gap-3">
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => selectPerson(person.id)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-slate-300"
                >
                  {person.display_name}
                </button>
              ))}
            </div>
            {adding ? (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Name</span>
                  <input
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Enter a name"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    onClick={createPerson}
                    type="button"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create & Edit"}
                  </button>
                  <button
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm"
                    onClick={() => {
                      setAdding(false);
                      setNewName("");
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
                onClick={() => setAdding(true)}
                type="button"
              >
                + Add New Person
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
