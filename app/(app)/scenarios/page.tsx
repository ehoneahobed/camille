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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Scenarios</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Pick a situation, warm up your mic, then open the live tutor. Configure{" "}
            <code className="text-zinc-300">GOOGLE_GENAI_API_KEY</code> and optional{" "}
            <code className="text-zinc-300">AWS_S3_BUCKET</code> for audio chunks.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
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
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              band === chip
                ? "bg-orange-600 text-white"
                : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {chip === "Any" ? "Any level" : chip}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {message}
        </p>
      ) : null}

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {filtered.map((s) => (
          <li
            key={s.id}
            className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">{s.level}</p>
            <h2 className="mt-1 text-lg font-medium text-zinc-100">{s.en}</h2>
            <p className="text-sm text-zinc-400">{s.fr}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">{s.desc}</p>
            <p className="mt-3 text-xs text-zinc-600">{s.topics.join(" · ")}</p>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => void startScenario(s.id)}
              className="mt-4 rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
            >
              {busyId === s.id ? "Starting…" : "Start"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
