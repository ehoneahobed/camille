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
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-rule-2 bg-canvas-2 px-4 py-2 text-sm text-ink shadow-lg"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      {phase === "live" ? (
        <header className="flex flex-col gap-3 rounded-xl border border-rule bg-canvas-2/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Live</p>
            <h1 className="font-display-sm text-lg text-ink">{scenarioLabel}</h1>
            <p className="text-xs text-mute">
              {formatElapsed(elapsedSec)} · max {maxMin} min
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mute">Gloss</span>
            {(["off", "hover", "always"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setGlossMode(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  glossMode === m
                    ? "bg-ink text-canvas"
                    : "border border-rule-2 text-ink-2 hover:border-mute hover:text-ink"
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              disabled
              title="Pause arrivera avec la reconnexion (M4)"
              className="rounded-full border border-rule px-3 py-1 text-xs text-mute-2"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => void endSession()}
              className="rounded-full border border-wine-soft bg-wine-soft/50 px-3 py-1 text-xs font-medium text-ink hover:bg-wine-soft/80"
            >
              End
            </button>
          </div>
        </header>
      ) : (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Before you start</p>
          <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">{scenarioLabel}</h1>
        </div>
      )}

      {softWarn && phase === "live" ? (
        <p className="rounded-lg border border-wine/40 bg-wine-soft/30 px-3 py-2 text-sm text-ink-2">
          Plus que ~{Math.max(1, Math.round(maxMin * 0.2))} minutes avant la limite de
          session — terminez ou enregistrez l&apos;essentiel.
        </p>
      ) : null}

      {prepareError ? (
        <p className="rounded-lg border border-wine-soft bg-wine-soft/40 px-3 py-2 text-sm text-ink-2">
          {prepareError}
        </p>
      ) : null}

      {phase === "prepare" && !prepareError ? (
        <div className="rounded-xl border border-rule bg-canvas-2/60 p-6">
          <p className="text-sm text-ink-2">
            Microphone: {deviceLabel || "Default device"} · niveau
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas-3">
            <div
              className="h-full rounded-full bg-wine-2 transition-[width] duration-75"
              style={{ width: `${Math.min(100, vuLevel * 400)}%` }}
            />
          </div>
          <button
            type="button"
            disabled={!mediaStream}
            onClick={() => setPhase("live")}
            className="mt-6 inline-flex bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start conversation
          </button>
        </div>
      ) : null}

      {phase === "live" ? (
        <>
          {error ? (
            <p className="rounded-lg border border-wine-soft bg-wine-soft/40 px-3 py-2 text-sm text-ink-2">
              {error}
            </p>
          ) : null}

          {uploadError ? (
            <p className="rounded-lg border border-wine/40 bg-wine-soft/30 px-3 py-2 text-sm text-ink-2">
              Audio upload: {uploadError}
            </p>
          ) : null}

          <p className="text-xs text-mute">
            {statusLine}
            {uploadedMaxIndex >= 0 ? ` · chunks uploaded: 0–${uploadedMaxIndex}` : null}
          </p>

          <section className="rounded-lg border border-rule bg-canvas-3/80 p-4">
            <p className="text-xs uppercase tracking-wide text-mute">Captions</p>
            {lastAssistantLine ? (
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-wide text-mute-2">Previous</p>
                <p className="text-sm text-ink-2">{lastAssistantLine}</p>
              </div>
            ) : null}
            <div
              className="mt-2 min-h-[72px] text-sm leading-relaxed text-ink"
              title={glossMode === "hover" ? glossTitle : undefined}
            >
              {assistantDraft ? (
                <p className="whitespace-pre-wrap">{assistantDraft}</p>
              ) : (
                <p className="text-mute">Assistant line…</p>
              )}
              {glossMode === "always" ? (
                <p className="mt-2 text-xs text-mute">Gloss (placeholder M4)</p>
              ) : null}
            </div>
          </section>

          <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
            <button
              type="button"
              className="rounded-full border border-rule-2 px-4 py-1.5 text-xs text-ink-2 hover:border-mute hover:text-ink"
              onClick={() => setToast("Aide « plus lent » — bientôt (M4)")}
            >
              Plus lent
            </button>
            <button
              type="button"
              className="rounded-full border border-rule-2 px-4 py-1.5 text-xs text-ink-2 hover:border-mute hover:text-ink"
              onClick={() => setToast("Aide « répéter » — bientôt (M4)")}
            >
              Répéter
            </button>
            <button
              type="button"
              className="rounded-full border border-rule-2 px-4 py-1.5 text-xs text-ink-2 hover:border-mute hover:text-ink"
              onClick={() =>
                setToast("Aide « qu'est-ce qu'elle a dit ? » — bientôt (M4)")
              }
            >
              Qu&apos;est-ce qu&apos;elle a dit ?
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-mute">
              Your message (French or English)
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              className="rounded-lg border border-rule-2 bg-canvas-3 px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void sendUserText()}
                className="bg-ink px-5 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-2"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => void endSession()}
                className="border border-rule-2 px-5 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-mute hover:text-ink"
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
