"use client";

import { IconArrow } from "@/components/icons";
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
    <div>
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onStart()}
          className="inline-flex items-center justify-center gap-2 bg-ink px-8 py-4 text-[15px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Starting…" : "Start a session"}
          {!busy ? <IconArrow size={15} /> : null}
        </button>
        <Link
          href="/scenarios"
          className="text-[13px] tracking-[0.01em] text-mute editorial-link transition-colors hover:text-ink"
        >
          Browse scenarios →
        </Link>
      </div>

      <div className="mt-8 max-w-md">
        <label className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
          Scenario
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="rounded-lg border border-rule-2 bg-canvas-3 px-3 py-2.5 font-sans text-[14px] text-ink outline-none transition-colors focus:border-ink"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.en}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-[12px] leading-relaxed text-mute">
          Mic check on the next screen, then a full-screen call with Camille&apos;s 3D avatar. Requires{" "}
          <code className="rounded bg-canvas-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
            GOOGLE_GENAI_API_KEY
          </code>{" "}
          in{" "}
          <code className="rounded bg-canvas-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">.env</code>.
        </p>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-wine-2" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
