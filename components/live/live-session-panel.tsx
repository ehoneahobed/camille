"use client";

import { IconMic, IconPause, IconPlay } from "@/components/icons";
import { useLiveRealtimeMic } from "@/hooks/use-live-realtime-mic";
import { useSessionRecorder } from "@/hooks/use-session-recorder";
import { ModelPcmPlaybackQueue } from "@/lib/live/model-pcm-playback";
import { base64ToInt16Pcm } from "@/lib/live/pcm-audio";
import {
  getMaxSessionMinutes,
  practiceElapsedMs,
  sessionSoftWarningAtMs,
} from "@/lib/config/session-limits";
import { SCENARIOS } from "@/lib/scenarios/seed";
import { GoogleGenAI, Modality, type Session } from "@google/genai/web";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { RpmAvatarStage, type AvatarGender, type AvatarState } from "./rpm-avatar-stage";

type Props = {
  sessionId: string;
  scenarioId: string;
  startedAt: string;
};

type GlossMode = "off" | "hover" | "always";

function mapModalities(values: string[]): Modality[] {
  return values.map((m) => {
    const u = String(m).toUpperCase();
    if (u === "AUDIO" || u.endsWith(".AUDIO")) {
      return Modality.AUDIO;
    }
    return Modality.TEXT;
  });
}

/** Normalise modality strings from the token JSON for UI + mic hook. */
function normalizeModalityStrings(raw: string[]): string[] {
  return raw.map((m) => {
    const u = String(m).toUpperCase();
    if (u.endsWith("AUDIO")) return "AUDIO";
    if (u.endsWith("TEXT")) return "TEXT";
    return u;
  });
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function deriveAvatarState(
  phase: "prepare" | "live",
  statusLine: string,
  assistantDraft: string,
  userInput: string,
  vuLevel: number,
  modelAudioActive: boolean,
): AvatarState {
  if (phase !== "live") return "idle";
  if (/connecting|offline/i.test(statusLine)) return "thinking";
  if (assistantDraft.trim().length > 0 || modelAudioActive) return "speaking";
  if (userInput.trim().length > 0 || vuLevel > 0.1) return "listening";
  return "listening";
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
  const [glossMode, setGlossMode] = useState<GlossMode>("hover");
  const [toast, setToast] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>("female");
  const [avatarSize, setAvatarSize] = useState(480);
  const [liveSession, setLiveSession] = useState<Session | null>(null);
  const [modalityStrings, setModalityStrings] = useState<string[]>(["TEXT"]);
  const [modelAudioPulse, setModelAudioPulse] = useState(false);
  /** Mic / realtime audio only after server `setupComplete` (avoids early chunks closing the socket). */
  const [liveWsReady, setLiveWsReady] = useState(false);
  /** Stops MediaRecorder before PATCH ends the practice session (avoids presign 409 race). */
  const [recordingGate, setRecordingGate] = useState(true);

  const assistantBufferRef = useRef("");
  const nextIndexRef = useRef(0);
  const playbackRef = useRef(new ModelPcmPlaybackQueue());
  const audioPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLiveRealtimeMic({
    session: liveSession,
    mediaStream,
    enabled: phase === "live" && !paused && liveWsReady,
    responseModalities: modalityStrings,
  });

  const { uploadError, uploadedMaxIndex } = useSessionRecorder({
    sessionId,
    mediaStream,
    active: phase === "live" && !paused && recordingGate,
    timesliceMs: 5000,
  });

  useEffect(() => {
    function onResize() {
      const w = typeof window !== "undefined" ? window.innerWidth : 520;
      if (w < 480) setAvatarSize(Math.max(260, w - 40));
      else if (w < 768) setAvatarSize(Math.min(400, w - 56));
      else setAvatarSize(520);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    if (phase !== "live" || paused) {
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
  }, [phase, paused, sessionStart]);

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
    let sessionHandle: Session | null = null;
    const playbackForCleanup = playbackRef.current;

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
        const modalityLabels = normalizeModalityStrings(responseModalities);
        const voiceOut = modalities.includes(Modality.AUDIO);

        const ai = new GoogleGenAI({
          apiKey: token,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const connected = await ai.live.connect({
          model,
          config: {
            responseModalities: modalities,
            ...(voiceOut
              ? {
                  inputAudioTranscription: {},
                  outputAudioTranscription: {},
                }
              : {}),
          },
          callbacks: {
            onopen: () => {
              if (!cancelled) {
                setStatusLine(
                  voiceOut
                    ? "Connected — microphone streams to Live; speak French or type below."
                    : "Connected — speak or type in French.",
                );
              }
            },
            onmessage: (message) => {
              const raw = message as unknown as Record<string, unknown>;
              if (raw.error != null && !cancelled) {
                console.warn("[live] server message error", raw.error);
                const err = raw.error as { message?: string };
                const msg =
                  typeof err?.message === "string"
                    ? err.message
                    : typeof raw.error === "string"
                      ? raw.error
                      : JSON.stringify(raw.error);
                setError(msg.slice(0, 280));
                setStatusLine("Offline");
              }
              if (message.setupComplete && !cancelled) {
                setLiveWsReady(true);
              }

              const sc = message.serverContent;
              if (sc?.interrupted) {
                playbackRef.current.flush();
              }

              const outTx = sc?.outputTranscription?.text;
              if (outTx) {
                assistantBufferRef.current += outTx;
                if (!cancelled) {
                  setAssistantDraft(assistantBufferRef.current);
                }
              }

              const parts = sc?.modelTurn?.parts;
              if (parts?.length) {
                let delta = "";
                for (const p of parts) {
                  if (p.text) {
                    delta += p.text;
                  }
                  const mime = p.inlineData?.mimeType ?? "";
                  const b64 = p.inlineData?.data;
                  if (b64 && mime.includes("pcm")) {
                    try {
                      const pcm = base64ToInt16Pcm(b64);
                      playbackRef.current.enqueueInt16Pcm(pcm);
                      if (!cancelled) {
                        if (audioPulseTimerRef.current) {
                          clearTimeout(audioPulseTimerRef.current);
                        }
                        setModelAudioPulse(true);
                        audioPulseTimerRef.current = setTimeout(() => {
                          setModelAudioPulse(false);
                          audioPulseTimerRef.current = null;
                        }, 450);
                      }
                    } catch (e) {
                      console.warn("[live] pcm decode", e);
                    }
                  }
                }
                if (delta) {
                  assistantBufferRef.current += delta;
                  if (!cancelled) {
                    setAssistantDraft(assistantBufferRef.current);
                  }
                }
              }

              if (sc?.turnComplete) {
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
            onclose: (ev) => {
              if (!cancelled) {
                setLiveWsReady(false);
                const code = ev?.code;
                const reason =
                  typeof ev?.reason === "string" && ev.reason.trim().length > 0
                    ? ev.reason.trim().slice(0, 120)
                    : "";
                const detail =
                  code != null && code !== 1000
                    ? ` (close ${code}${reason ? `: ${reason}` : ""})`
                    : reason
                      ? ` (${reason})`
                      : "";
                console.warn("[live] websocket closed", { code, reason: ev?.reason });
                setStatusLine(`Disconnected${detail}`);
              }
            },
          },
        });

        if (cancelled) {
          connected.close();
          return;
        }
        sessionHandle = connected;
        if (!cancelled) {
          setModalityStrings(modalityLabels);
          setLiveSession(connected);
        }
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
      if (audioPulseTimerRef.current) {
        clearTimeout(audioPulseTimerRef.current);
        audioPulseTimerRef.current = null;
      }
      sessionHandle?.close();
      sessionHandle = null;
      setLiveSession(null);
      setModalityStrings(["TEXT"]);
      setLiveWsReady(false);
      playbackForCleanup.flush();
    };
  }, [persistTurns, phase, sessionId]);

  const sendHelpTurn = useCallback(
    async (text: string, kind: string) => {
      const sess = liveSession;
      if (!sess) return;
      const idx = nextIndexRef.current;
      nextIndexRef.current = idx + 1;
      setNextIndex(idx + 1);
      try {
        await persistTurns([
          {
            index: idx,
            role: "USER",
            text,
            occurredAt: new Date().toISOString(),
            kind,
          },
        ]);
        sess.sendClientContent({
          turns: text,
          turnComplete: true,
        });
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Send failed");
      }
    },
    [liveSession, persistTurns],
  );

  async function sendUserText() {
    const trimmed = userInput.trim();
    if (!trimmed || !liveSession) {
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
      liveSession.sendClientContent({
        turns: trimmed,
        turnComplete: true,
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Send failed");
    }
  }

  async function endSession() {
    flushSync(() => {
      setRecordingGate(false);
    });
    liveSession?.close();
    setLiveSession(null);
    playbackRef.current.flush();
    void playbackRef.current.dispose();
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

  const avatarState = deriveAvatarState(
    phase,
    statusLine,
    assistantDraft,
    userInput,
    vuLevel,
    modelAudioPulse,
  );
  const aiSpeaking = assistantDraft.trim().length > 0 || modelAudioPulse;
  const displayName = avatarGender === "female" ? "Camille" : "Léo";

  const captionPrimary =
    assistantDraft.trim() ||
    lastAssistantLine ||
    (phase === "live" ? "…" : "When you are ready, start the call.");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas text-ink page-enter">
      <div className="pointer-events-none absolute inset-0 z-0 vc-vignette" aria-hidden />

      {toast ? (
        <p
          className="fixed bottom-24 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-full border border-rule-2 bg-canvas-2 px-4 py-2 text-center text-sm text-ink shadow-lg"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      {phase === "prepare" ? (
        <div className="relative z-10 flex flex-1 flex-col px-6 pb-10 pt-8 sm:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute transition-colors hover:text-ink"
            >
              ← Back
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              Before you start
            </span>
          </div>
          <div className="mx-auto mt-10 flex w-full max-w-lg flex-1 flex-col justify-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-wine">Mic check</p>
            <h1 className="mt-3 font-display text-3xl tracking-[-0.02em] sm:text-4xl">{scenarioLabel}</h1>
            <p className="mt-4 font-display-sm text-[15px] leading-relaxed text-ink-2">
              Next step feels like a video call: Camille in the main frame, you in the corner tile, captions
              underneath.
            </p>
            {prepareError ? (
              <p className="mt-6 rounded-lg border border-wine-soft bg-wine-soft/40 px-4 py-3 text-sm text-ink-2">
                {prepareError}
              </p>
            ) : (
              <div className="mt-8 rounded-xl border border-rule-2 bg-canvas-2/80 p-6 backdrop-blur">
                <p className="text-sm text-ink-2">
                  Microphone: <span className="text-ink">{deviceLabel || "Default device"}</span>
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-canvas-3">
                  <div
                    className="h-full rounded-full bg-wine-2 transition-[width] duration-75"
                    style={{ width: `${Math.min(100, vuLevel * 400)}%` }}
                  />
                </div>
                <button
                  type="button"
                  disabled={!mediaStream}
                  onClick={() => setPhase("live")}
                  className="mt-8 inline-flex items-center gap-2 bg-ink px-8 py-4 text-[15px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Start call
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-wine breath" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2">
                Live · {scenarioLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-5">
              <div className="flex items-center gap-0.5 border border-rule-2 bg-canvas-2/60 px-0.5 py-0.5">
                {(
                  [
                    { id: "always" as const, label: "Show EN" },
                    { id: "hover" as const, label: "On hover" },
                    { id: "off" as const, label: "No gloss" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGlossMode(m.id)}
                    className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                      glossMode === m.id ? "bg-wine text-canvas" : "text-mute hover:text-ink"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[11px] tabular tracking-[0.16em] text-mute">
                {formatElapsed(elapsedSec)}
              </span>
              <span className="hidden text-rule-2 sm:inline">·</span>
              <span className="hidden max-w-[140px] truncate font-mono text-[10px] uppercase tracking-[0.14em] text-mute sm:inline">
                max {maxMin}m
              </span>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="text-mute transition-colors hover:text-ink"
                title={paused ? "Resume" : "Pause (local)"}
              >
                {paused ? <IconPlay size={14} /> : <IconPause size={14} />}
              </button>
              <button
                type="button"
                onClick={() => void endSession()}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-wine-2 transition-colors hover:text-ink"
              >
                End call
              </button>
            </div>
          </div>

          {softWarn ? (
            <p className="relative z-10 mx-6 mt-4 rounded-lg border border-wine/40 bg-wine-soft/30 px-4 py-2 text-sm text-ink-2 sm:mx-10">
              Plus que ~{Math.max(1, Math.round(maxMin * 0.2))} minutes avant la limite de session.
            </p>
          ) : null}

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-4 sm:px-8">
            <div
              className={`relative border border-rule-2 bg-canvas-2 ${aiSpeaking ? "speaker-glow" : ""}`}
              style={{ width: avatarSize, height: avatarSize, maxWidth: "100%" }}
            >
              <RpmAvatarStage gender={avatarGender} state={avatarState} size={avatarSize} />
              <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-canvas/85 px-2 py-1 font-sans text-[12px] font-medium tracking-[0.01em] text-ink backdrop-blur">
                  {displayName}
                </span>
                {aiSpeaking ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-wine breath" aria-hidden />
                ) : null}
              </div>
              <div className="absolute right-3 top-3 flex items-center gap-0.5 border border-rule-2 bg-canvas/70 px-0.5 py-0.5 backdrop-blur">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setAvatarGender(g)}
                    className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                      avatarGender === g ? "bg-wine text-canvas" : "text-mute hover:text-ink"
                    }`}
                  >
                    {g === "female" ? "Camille" : "Léo"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 min-h-[100px] max-w-[820px] px-4 text-center">
              <span className="mb-3 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
                {assistantDraft.trim() ? `${displayName}` : lastAssistantLine ? `${displayName}` : "Captions"}
              </span>
              <p
                className="font-display text-[22px] leading-[1.35] tracking-[-0.01em] text-ink sm:text-[28px] sm:leading-[1.3]"
                title={
                  glossMode === "hover" || glossMode === "always"
                    ? "Gloss modes — full gloss UI in a later milestone."
                    : undefined
                }
              >
                {captionPrimary}
              </p>
              {glossMode === "always" ? (
                <p className="mt-2 text-[14px] italic text-mute">English gloss — coming soon (M4)</p>
              ) : null}
            </div>
          </div>

          <div className="absolute right-4 top-24 z-20 h-[124px] w-[min(180px,42vw)] border border-rule-2 bg-canvas-2 sm:right-8">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-canvas-3 to-canvas">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-wine/30">
                <span className="font-display text-2xl text-ink">You</span>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-canvas/70 px-2 py-0.5 text-[11px] font-medium text-ink backdrop-blur">
              You
            </div>
            {vuLevel > 0.12 && !paused ? (
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-wine-2 breath" aria-hidden />
            ) : null}
          </div>

          {error ? (
            <p className="relative z-10 mx-6 rounded-lg border border-wine-soft bg-wine-soft/40 px-4 py-2 text-sm text-ink-2 sm:mx-10">
              {error}
            </p>
          ) : null}
          {uploadError ? (
            <p className="relative z-10 mx-6 rounded-lg border border-wine/40 bg-wine-soft/30 px-4 py-2 text-sm text-ink-2 sm:mx-10">
              Audio upload: {uploadError}
            </p>
          ) : null}

          <p className="relative z-10 mx-6 mt-1 font-mono text-[10px] text-mute sm:mx-10">
            {statusLine}
            {modalityStrings.includes("AUDIO") ? " · Voice mode (mic + optional spoken reply)" : null}
            {uploadedMaxIndex >= 0 ? ` · chunks 0–${uploadedMaxIndex}` : null}
          </p>

          <div className="relative z-10 mt-auto border-t border-rule bg-canvas-2/80 backdrop-blur">
            <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-4 sm:px-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowHelp((h) => !h)}
                  className={`border px-3 py-2 font-mono text-[12px] uppercase tracking-[0.16em] transition-colors ${
                    showHelp
                      ? "border-wine bg-wine text-canvas"
                      : "border-rule-2 text-ink-2 hover:bg-canvas-3"
                  }`}
                >
                  ? What did she just say?
                </button>
                <button
                  type="button"
                  disabled={!liveSession || paused}
                  className="border border-rule-2 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:bg-canvas-3 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    void sendHelpTurn(
                      "[Help] How do I say what I mean in French? Give one short natural phrase I can repeat.",
                      "help-phrase",
                    )
                  }
                >
                  How do I say…?
                </button>
                <button
                  type="button"
                  disabled={!liveSession || paused}
                  className="border border-rule-2 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:bg-canvas-3 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    void sendHelpTurn(
                      "[Help] Please slow down and use simpler French. One sentence at a time.",
                      "help-slow",
                    )
                  }
                >
                  Slow down
                </button>
                <button
                  type="button"
                  disabled={!liveSession || paused}
                  className="border border-rule-2 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:bg-canvas-3 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() =>
                    void sendHelpTurn(
                      "[Help] Please repeat your last French line, a bit more clearly.",
                      "help-repeat",
                    )
                  }
                >
                  Repeat
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-3 text-ink transition-colors hover:bg-wine"
                    title="Microphone active"
                  >
                    <IconMic size={16} />
                  </span>
                  <button
                    type="button"
                    onClick={() => void endSession()}
                    className="h-10 bg-wine-2 px-4 text-[12px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-wine"
                  >
                    End call
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-rule border-opacity-60 pt-4">
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                  Message (optional)
                </label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={2}
                  disabled={paused}
                  className="rounded-lg border border-rule-2 bg-canvas-3 px-3 py-2 text-sm text-ink outline-none focus:border-ink disabled:opacity-50"
                  placeholder="Type in French or English…"
                />
                <button
                  type="button"
                  disabled={paused}
                  onClick={() => void sendUserText()}
                  className="self-start bg-ink px-5 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>

            {showHelp ? (
              <div className="border-t border-rule bg-canvas-3 px-6 py-5 sm:px-10">
                <div className="mx-auto max-w-[1280px]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                    Last line (context)
                  </p>
                  <p className="mt-2 font-display-sm text-[18px] text-ink">
                    {lastAssistantLine || assistantDraft.trim() || "—"}
                  </p>
                  <p className="mt-2 text-[13px] italic text-mute">
                    Full live translation rail ships in M4 — this is a quick reminder of the last caption.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
