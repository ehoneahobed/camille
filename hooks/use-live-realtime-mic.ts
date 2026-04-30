import {
  downmixToMono,
  floatTo16BitPCM,
  int16PcmToBase64,
  LIVE_INPUT_SAMPLE_RATE,
  resampleFloatLinear,
} from "@/lib/live/pcm-audio";
import type { Session } from "@google/genai/web";
import { useEffect, useRef } from "react";

type UseLiveRealtimeMicArgs = {
  /** Active Live session (from `ai.live.connect`). */
  session: Session | null;
  mediaStream: MediaStream | null;
  /** When false, processing stops and `audioStreamEnd` is sent once. */
  enabled: boolean;
  /** From token mint — must include `"AUDIO"` to stream mic. */
  responseModalities: string[];
};

/**
 * Streams microphone audio to Gemini Live using `sendRealtimeInput` (16 kHz PCM).
 * Uses `ScriptProcessorNode` (deprecated but widely supported); output goes through a zero-gain node to avoid echo.
 */
export function useLiveRealtimeMic({
  session,
  mediaStream,
  enabled,
  responseModalities,
}: UseLiveRealtimeMicArgs): void {
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
  }, [session]);

  useEffect(() => {
    const wantsAudio = responseModalities.some((m) => m.toUpperCase() === "AUDIO");
    if (!session || !mediaStream || !enabled || !wantsAudio) {
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(mediaStream);
    const bufferSize = 4096;
    const processor = audioContext.createScriptProcessor(
      bufferSize,
      source.channelCount,
      source.channelCount,
    );

    const mute = audioContext.createGain();
    mute.gain.value = 0;

    processor.onaudioprocess = (ev) => {
      if (endedRef.current) return;
      const inputBuffer = ev.inputBuffer;
      const ch = inputBuffer.numberOfChannels;
      const channels: Float32Array[] = [];
      for (let c = 0; c < ch; c++) {
        channels.push(inputBuffer.getChannelData(c));
      }
      const mono = downmixToMono(channels, ch);
      const resampled = resampleFloatLinear(mono, audioContext.sampleRate, LIVE_INPUT_SAMPLE_RATE);
      const pcm = floatTo16BitPCM(resampled);
      const data = int16PcmToBase64(pcm);
      try {
        session.sendRealtimeInput({
          audio: {
            mimeType: `audio/pcm;rate=${LIVE_INPUT_SAMPLE_RATE}`,
            data,
          },
        });
      } catch (e) {
        console.error("[useLiveRealtimeMic] sendRealtimeInput", e);
      }
    };

    source.connect(processor);
    processor.connect(mute);
    mute.connect(audioContext.destination);

    return () => {
      endedRef.current = true;
      try {
        session.sendRealtimeInput({ audioStreamEnd: true });
      } catch {
        /* session may already be closed */
      }
      processor.disconnect();
      mute.disconnect();
      source.disconnect();
      void audioContext.close();
    };
  }, [enabled, mediaStream, responseModalities, session]);
}
