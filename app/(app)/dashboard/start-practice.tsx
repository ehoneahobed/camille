"use client";

import { SCENARIOS } from "@/lib/scenarios/seed";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartPractice() {
  const router = useRouter();
  const [scenarioId, setScenarioId] = useState("cafe");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onStart() {
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(async () => ({ error: await res.text() }));
        throw new Error(
          typeof body === "object" && body && "error" in body
            ? String((body as { error: unknown }).error)
            : "Could not start session",
        );
      }
      const data = (await res.json()) as { id: string };
      router.push(`/live/${data.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Start failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-lg font-medium text-zinc-100">Start a practice session</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Opens the Gemini Live tutor after a short mic check (configure{" "}
        <code className="text-zinc-300">GOOGLE_GENAI_API_KEY</code> in{" "}
        <code className="text-zinc-300">.env</code>). Prefer the full grid?{" "}
        <Link href="/scenarios" className="text-orange-400 underline-offset-2 hover:underline">
          Browse scenarios
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-400">
          Scenario
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.en}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onStart()}
          className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        >
          {busy ? "Starting…" : "Begin"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
