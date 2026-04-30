import { int16ToFloat32, LIVE_OUTPUT_SAMPLE_RATE } from "@/lib/live/pcm-audio";

/**
 * Schedules 24 kHz mono PCM chunks from the model for gapless-ish Web Audio playback.
 */
export class ModelPcmPlaybackQueue {
  private ctx: AudioContext | null = null;
  private nextStart = 0;

  ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
    }
    return this.ctx;
  }

  /** Enqueues one chunk of **little-endian int16** PCM at `LIVE_OUTPUT_SAMPLE_RATE`. */
  enqueueInt16Pcm(pcm: Int16Array): void {
    if (pcm.length === 0) return;
    const ctx = this.ensureContext();
    const floats = int16ToFloat32(pcm);
    const buffer = ctx.createBuffer(1, floats.length, LIVE_OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(new Float32Array(floats), 0, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    if (this.nextStart < now) {
      this.nextStart = now + 0.02;
    }
    src.start(this.nextStart);
    this.nextStart += buffer.duration;
  }

  flush(): void {
    this.nextStart = 0;
  }

  async dispose(): Promise<void> {
    if (this.ctx) {
      await this.ctx.close();
      this.ctx = null;
    }
    this.nextStart = 0;
  }
}
