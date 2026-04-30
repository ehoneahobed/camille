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
    <div className="mt-10 rounded-xl border border-rule bg-canvas-2/50 p-6 sm:p-8">
      <h2 className="font-display-sm text-xl text-ink">Start a practice session</h2>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        Opens the Gemini Live tutor after a short mic check (configure{" "}
        <code className="rounded bg-canvas-3 px-1.5 py-0.5 font-mono text-[12px] text-ink-2">
          GOOGLE_GENAI_API_KEY
        </code>{" "}
        in{" "}
        <code className="rounded bg-canvas-3 px-1.5 py-0.5 font-mono text-[12px] text-ink-2">.env</code>
        ). Prefer the full grid?{" "}
        <Link href="/scenarios" className="text-wine-2 underline-offset-2 transition-colors hover:text-wine hover:underline">
          Browse scenarios
        </Link>
        .
      </p>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-[13px] text-mute">
          Scenario
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="rounded-lg border border-rule-2 bg-canvas-3 px-3 py-2.5 text-ink outline-none transition-colors focus:border-ink"
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
          className="inline-flex shrink-0 items-center justify-center bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Starting…" : "Begin"}
        </button>
      </div>
      {message ? (
        <p className="mt-4 text-sm text-wine-2" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
