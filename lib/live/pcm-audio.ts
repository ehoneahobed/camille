/** Target sample rate for Gemini Live microphone input (see Google Live API docs). */
export const LIVE_INPUT_SAMPLE_RATE = 16000;
/** Model output PCM rate for Live audio responses. */
export const LIVE_OUTPUT_SAMPLE_RATE = 24000;

/**
 * Downmixes to mono (simple average) then linearly resamples `input` from `fromRate` to `toRate`.
 */
export function resampleFloatLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    return input;
  }
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i * ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = srcPos - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

export function downmixToMono(input: Float32Array[], channelCount: number): Float32Array {
  if (channelCount <= 1 || input.length === 0) {
    return input[0] ?? new Float32Array(0);
  }
  const len = input[0]?.length ?? 0;
  const out = new Float32Array(len);
  for (let c = 0; c < channelCount; c++) {
    const ch = input[c];
    if (!ch) continue;
    for (let i = 0; i < len; i++) {
      out[i] += ch[i] ?? 0;
    }
  }
  const inv = 1 / channelCount;
  for (let i = 0; i < len; i++) {
    out[i] *= inv;
  }
  return out;
}

export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    out[i] = s < 0 ? (s * 0x8000) | 0 : (s * 0x7fff) | 0;
  }
  return out;
}

export function int16PcmToBase64(pcm: Int16Array): string {
  const u8 = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]!);
  }
  return btoa(binary);
}

/** Decode base64 payload from Live `inlineData.data` into little-endian int16 samples. */
export function base64ToInt16Pcm(b64: string): Int16Array {
  const bin = atob(b64);
  const len = bin.length & ~1;
  const out = new Int16Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    const lo = bin.charCodeAt(i);
    const hi = bin.charCodeAt(i + 1);
    out[i / 2] = (hi << 8) | lo;
  }
  return out;
}

export function int16ToFloat32(input: Int16Array): Float32Array {
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    out[i] = input[i]! / 32768;
  }
  return out;
}
