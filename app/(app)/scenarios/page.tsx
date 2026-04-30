"use client";

import { SCENARIOS, type CefrBand } from "@/lib/scenarios/seed";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const CHIPS: Array<"Any" | CefrBand> = ["Any", "A2", "B1", "B2", "C1"];

export default function ScenariosPage() {
  const router = useRouter();
  const [band, setBand] = useState<"Any" | CefrBand>("Any");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (band === "Any") {
      return SCENARIOS;
    }
    return SCENARIOS.filter((s) => s.cefrBands.includes(band));
  }, [band]);

  async function startScenario(scenarioId: string) {
    setMessage(null);
    setBusyId(scenarioId);
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
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Practice</p>
          <h1 className="mt-2 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">Scenarios</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
            Pick a situation, warm up your mic, then open the live tutor. Configure{" "}
            <code className="rounded bg-canvas-3 px-1.5 py-0.5 font-mono text-[12px] text-ink-2">
              GOOGLE_GENAI_API_KEY
            </code>{" "}
            for Live. For audio chunks use{" "}
            <code className="rounded bg-canvas-3 px-1.5 py-0.5 font-mono text-[12px] text-ink-2">
              AUDIO_STORAGE_BACKEND=local
            </code>{" "}
            or AWS S3 (see README).
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setBand(chip)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              band === chip
                ? "bg-ink text-canvas"
                : "border border-rule-2 text-ink-2 hover:border-mute hover:text-ink"
            }`}
          >
            {chip === "Any" ? "Any level" : chip}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-wine-2" role="alert">
          {message}
        </p>
      ) : null}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {filtered.map((s) => (
          <li
            key={s.id}
            className="flex flex-col rounded-xl border border-rule bg-canvas-2/60 p-5 sm:p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">{s.level}</p>
            <h2 className="mt-2 font-display-sm text-xl text-ink">{s.en}</h2>
            <p className="text-sm text-ink-2">{s.fr}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{s.desc}</p>
            <p className="mt-3 text-xs text-mute-2">{s.topics.join(" · ")}</p>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => void startScenario(s.id)}
              className="mt-4 inline-flex items-center justify-center bg-ink px-5 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyId === s.id ? "Starting…" : "Start"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
