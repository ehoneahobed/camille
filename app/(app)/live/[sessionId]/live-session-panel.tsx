"use client";

import { useSessionRecorder } from "@/hooks/use-session-recorder";
import {
  getMaxSessionMinutes,
  practiceElapsedMs,
  sessionSoftWarningAtMs,
} from "@/lib/config/session-limits";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { GoogleGenAI, Modality, type Session } from "@google/genai/web";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  sessionId: string;
  scenarioId: string;
  startedAt: string;
};

type GlossMode = "off" | "hover" | "always";

function mapModalities(values: string[]): Modality[] {
  return values.map((m) => {
    if (m === "AUDIO") {
      return Modality.AUDIO;
    }
    return Modality.TEXT;
  });
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LiveSessionPanel({ sessionId, scenarioId, startedAt }: Props) {
  const router = useRouter();
  const sessionStart = useMemo(() => new Date(startedAt), [startedAt]);
  const scenarioLabel =
    SCENARIOS.find((s) => s.id === scenarioId)?.en ?? scenarioId;

  const [phase, setPhase] = useState<"prepare" | "live">("prepare");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [deviceLabel, setDeviceLabel] = useState<string>("");
  const [vuLevel, setVuLevel] = useState(0);

  const [statusLine, setStatusLine] = useState("Connecting…");
  const [assistantDraft, setAssistantDraft] = useState("");
  const [lastAssistantLine, setLastAssistantLine] = useState("");
  const [userInput, setUserInput] = useState("");
  const [nextIndex, setNextIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [glossMode, setGlossMode] = useState<GlossMode>("off");
  const [toast, setToast] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const liveRef = useRef<Session | null>(null);
  const assistantBufferRef = useRef("");
  const nextIndexRef = useRef(0);

  const { uploadError, uploadedMaxIndex } = useSessionRecorder({
    sessionId,
    mediaStream,
    active: phase === "live",
    timesliceMs: 5000,
  });

  const persistTurns = useCallback(
    async (
      batch: {
        index: number;
        role: "USER" | "ASSISTANT";
        text: string;
        occurredAt: string;
        kind?: string | null;
      }[],
    ) => {
      const res = await fetch(`/api/sessions/${sessionId}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns: batch }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Turn write failed (${res.status})`);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    nextIndexRef.current = nextIndex;
  }, [nextIndex]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (phase !== "live") {
      return;
    }
    function tick() {
      setElapsedSec(Math.floor(practiceElapsedMs(sessionStart) / 1000));
    }
    const id = window.setInterval(tick, 1000);
    const boot = window.setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(boot);
    };
  }, [phase, sessionStart]);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;

    async function prepare() {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          ms.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = ms;
        setMediaStream(ms);
        const deviceId = ms.getAudioTracks()[0]?.getSettings().deviceId;
        if (deviceId) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const match = devices.find((d) => d.deviceId === deviceId && d.label);
          if (match?.label) {
            setDeviceLabel(match.label);
          }
        }

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(ms);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        ctx = audioCtx;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          if (cancelled) {
            return;
          }
          analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            sum += buf[i];
          }
          setVuLevel(sum / buf.length / 255);
          raf = requestAnimationFrame(tick);
        }
        raf = requestAnimationFrame(tick);
      } catch (e) {
        if (!cancelled) {
          setPrepareError(
            e instanceof Error ? e.message : "Microphone permission denied",
          );
        }
      }
    }

    void prepare();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      void ctx?.close();
      stream?.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    };
  }, [sessionId]);

  useEffect(() => {
    if (phase !== "live") {
      return;
    }

    let cancelled = false;

    async function run() {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        if (!cancelled) {
          setError("Could not load session");
          setStatusLine("Offline");
        }
        return;
      }
      const data = (await res.json()) as { turns?: { index: number }[] };
      const max =
        data.turns && data.turns.length > 0
          ? Math.max(...data.turns.map((t) => t.index))
          : -1;
      const next = max + 1;
      if (!cancelled) {
        setNextIndex(next);
        nextIndexRef.current = next;
      }

      try {
        const tokenRes = await fetch("/api/realtime/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!tokenRes.ok) {
          const msg = await tokenRes.json().catch(async () => ({
            error: await tokenRes.text(),
          }));
          throw new Error(
            typeof msg === "object" && msg && "error" in msg
              ? String((msg as { error: unknown }).error)
              : "Token request failed",
          );
        }
        const { token, model, responseModalities } = (await tokenRes.json()) as {
          token: string;
          model: string;
          responseModalities: string[];
        };

        const modalities = mapModalities(responseModalities);

        const ai = new GoogleGenAI({
          apiKey: token,
          apiVersion: "v1alpha",
        });

        const liveSession = await ai.live.connect({
          model,
          config: {
            responseModalities: modalities,
          },
          callbacks: {
            onopen: () => {
              if (!cancelled) {
                setStatusLine("Connected — speak or type in French.");
              }
            },
            onmessage: (message) => {
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts?.length) {
                let delta = "";
                for (const p of parts) {
                  if (p.text) {
                    delta += p.text;
                  }
                }
                if (delta) {
                  assistantBufferRef.current += delta;
                  if (!cancelled) {
                    setAssistantDraft(assistantBufferRef.current);
                  }
                }
              }

              if (message.serverContent?.turnComplete) {
                const text = assistantBufferRef.current.trim();
                assistantBufferRef.current = "";
                if (!cancelled) {
                  setAssistantDraft("");
                }
                if (text) {
                  if (!cancelled) {
                    setLastAssistantLine(text);
                  }
                  const idx = nextIndexRef.current;
                  nextIndexRef.current = idx + 1;
                  if (!cancelled) {
                    setNextIndex(idx + 1);
                  }
                  void persistTurns([
                    {
                      index: idx,
                      role: "ASSISTANT",
                      text,
                      occurredAt: new Date().toISOString(),
                      kind: "normal",
                    },
                  ]).catch((e) => {
                    console.error(e);
                    if (!cancelled) {
                      setError(e instanceof Error ? e.message : "Turn save failed");
                    }
                  });
                }
              }
            },
            onerror: (e) => {
              console.error(e);
              if (!cancelled) {
                setError(e.message || "Live connection error");
              }
            },
            onclose: () => {
              if (!cancelled) {
                setStatusLine("Disconnected");
              }
            },
          },
        });

        if (cancelled) {
          liveSession.close();
          return;
        }
        liveRef.current = liveSession;
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not connect");
          setStatusLine("Offline");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      liveRef.current?.close();
      liveRef.current = null;
    };
  }, [persistTurns, phase, sessionId]);

  async function sendUserText() {
    const trimmed = userInput.trim();
    if (!trimmed || !liveRef.current) {
      return;
    }
    setUserInput("");
    const idx = nextIndexRef.current;
    nextIndexRef.current = idx + 1;
    setNextIndex(idx + 1);
    try {
      await persistTurns([
        {
          index: idx,
          role: "USER",
          text: trimmed,
          occurredAt: new Date().toISOString(),
          kind: "normal",
        },
      ]);
      liveRef.current.sendClientContent({
        turns: trimmed,
        turnComplete: true,
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Send failed");
    }
  }

  async function endSession() {
    liveRef.current?.close();
    liveRef.current = null;
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENDED" }),
    });
    router.push(`/sessions/${sessionId}/complete`);
    router.refresh();
  }

  const softWarn = sessionSoftWarningAtMs(sessionStart);
  const maxMin = getMaxSessionMinutes();

  const glossTitle =
    glossMode === "hover" || glossMode === "always"
      ? "Glossaire (aperçu M4) — survolez ou activez le mode pour les notes."
      : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      {toast ? (
        <p
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 shadow-lg"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      {phase === "live" ? (
        <header className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Live
            </p>
            <h1 className="text-lg font-semibold text-zinc-50">{scenarioLabel}</h1>
            <p className="text-xs text-zinc-500">
              {formatElapsed(elapsedSec)} · max {maxMin} min
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Gloss</span>
            {(["off", "hover", "always"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setGlossMode(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  glossMode === m
                    ? "bg-orange-600 text-white"
                    : "border border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              disabled
              title="Pause arrivera avec la reconnexion (M4)"
              className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-600"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => void endSession()}
              className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-950/70"
            >
              End
            </button>
          </div>
        </header>
      ) : (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Before you start
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-50">{scenarioLabel}</h1>
        </div>
      )}

      {softWarn && phase === "live" ? (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Plus que ~{Math.max(1, Math.round(maxMin * 0.2))} minutes avant la limite de
          session — terminez ou enregistrez l&apos;essentiel.
        </p>
      ) : null}

      {prepareError ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {prepareError}
        </p>
      ) : null}

      {phase === "prepare" && !prepareError ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-sm text-zinc-400">
            Microphone: {deviceLabel || "Default device"} · niveau
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-orange-500 transition-[width] duration-75"
              style={{ width: `${Math.min(100, vuLevel * 400)}%` }}
            />
          </div>
          <button
            type="button"
            disabled={!mediaStream}
            onClick={() => setPhase("live")}
            className="mt-6 rounded-full bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-40"
          >
            Start conversation
          </button>
        </div>
      ) : null}

      {phase === "live" ? (
        <>
          {error ? (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {uploadError ? (
            <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
              Audio upload: {uploadError}
            </p>
          ) : null}

          <p className="text-xs text-zinc-500">
            {statusLine}
            {uploadedMaxIndex >= 0 ? ` · chunks uploaded: 0–${uploadedMaxIndex}` : null}
          </p>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Captions</p>
            {lastAssistantLine ? (
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-600">Previous</p>
                <p className="text-sm text-zinc-400">{lastAssistantLine}</p>
              </div>
            ) : null}
            <div
              className="mt-2 min-h-[72px] text-sm leading-relaxed text-zinc-100"
              title={glossMode === "hover" ? glossTitle : undefined}
            >
              {assistantDraft ? (
                <p className="whitespace-pre-wrap">{assistantDraft}</p>
              ) : (
                <p className="text-zinc-500">Assistant line…</p>
              )}
              {glossMode === "always" ? (
                <p className="mt-2 text-xs text-zinc-500">Gloss (placeholder M4)</p>
              ) : null}
            </div>
          </section>

          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
              onClick={() => setToast("Aide « plus lent » — bientôt (M4)")}
            >
              Plus lent
            </button>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
              onClick={() => setToast("Aide « répéter » — bientôt (M4)")}
            >
              Répéter
            </button>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
              onClick={() =>
                setToast("Aide « qu'est-ce qu'elle a dit ? » — bientôt (M4)")
              }
            >
              Qu&apos;est-ce qu&apos;elle a dit ?
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Your message (French or English)
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void sendUserText()}
                className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-950 hover:bg-white"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => void endSession()}
                className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-400"
              >
                End session
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
